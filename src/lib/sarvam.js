import JSZip from 'jszip'

const API_BASE = '/api/sarvam'

const DEMO_DATA = {
  product_name: 'Samsung Galaxy S24 5G',
  brand: 'Samsung',
  model_number: 'SM-S921B',
  serial_number: 'R3CR90ABCDE',
  purchase_amount: '79999',
  warranty_months: 12,
}

const EXTRACTION_PROMPT = `Extract the following fields from this product invoice or box label text.
Return ONLY a valid JSON object with these exact keys:
{
  "product_name": "full product name with model",
  "brand": "brand/manufacturer name",
  "model_number": "model or part number",
  "serial_number": "serial number or IMEI if present, else null",
  "purchase_amount": "numeric amount in INR, digits only",
  "warranty_months": "warranty period in months as integer, 12 if not found"
}
If a field is not found, use null. Return only the JSON, no explanation.`

function wrapFetchError(err, step) {
  if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
    return new Error(
      `${step}: network error. Restart the dev server with "npm run dev" and try again.`
    )
  }
  return err
}

async function sarvamFetch(path, options = {}) {
  const headers = { ...options.headers }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch (err) {
    throw wrapFetchError(err, 'Sarvam API request failed')
  }

  if (!response.ok) {
    let message = `Sarvam API error: ${response.status}`
    try {
      const err = await response.json()
      message = err?.error?.message || err?.error || message
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

function getFileName(file) {
  if (file.type === 'application/pdf') return 'invoice.pdf'
  if (file.type === 'image/png') return 'invoice.png'
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') return 'invoice.jpg'
  const ext = file.name?.split('.').pop()?.toLowerCase() || 'png'
  return `invoice.${ext}`
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadToPresignedUrl(url, file) {
  const fileBase64 = await fileToBase64(file)

  let response
  try {
    response = await fetch('/api/sarvam/blob-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadUrl: url,
        contentType: file.type || 'application/octet-stream',
        fileBase64,
      }),
    })
  } catch (err) {
    throw wrapFetchError(err, 'Invoice upload failed')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Failed to upload invoice to Sarvam (${response.status})`)
  }
}

async function pollJobStatus(jobId, maxAttempts = 45) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await sarvamFetch(`/doc-digitization/job/v1/${jobId}/status`)
    if (status.job_state === 'Completed' || status.job_state === 'PartiallyCompleted') {
      return status
    }
    if (status.job_state === 'Failed') {
      throw new Error(status.error_message || 'Sarvam Vision failed to process the document')
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error('Sarvam Vision timed out while reading your invoice')
}

async function extractTextFromJob(jobId) {
  const download = await sarvamFetch(`/doc-digitization/job/v1/${jobId}/download-files`, {
    method: 'POST',
    body: '{}',
  })

  const zipUrl = download.download_urls?.['document.zip']?.file_url
  if (!zipUrl) throw new Error('Sarvam Vision returned no document output')

  let zipResponse
  try {
    zipResponse = await fetch(`/api/sarvam/blob-download?url=${encodeURIComponent(zipUrl)}`)
  } catch (err) {
    throw wrapFetchError(err, 'Failed to download Sarvam output')
  }

  if (!zipResponse.ok) {
    const err = await zipResponse.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to download Sarvam Vision output')
  }

  const zip = await JSZip.loadAsync(await zipResponse.arrayBuffer())
  let text = ''

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue
    const content = await entry.async('string')
    if (name.endsWith('.json')) {
      try {
        text += JSON.stringify(JSON.parse(content)) + '\n'
      } catch {
        text += content + '\n'
      }
    } else if (name.endsWith('.md') || name.endsWith('.html') || name.endsWith('.txt')) {
      text += content + '\n'
    }
  }

  if (!text.trim()) throw new Error('Sarvam Vision could not extract text from the invoice')
  return text
}

async function structureWithChat(invoiceText) {
  const data = await sarvamFetch('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: 'sarvam-30b',
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\n--- INVOICE TEXT ---\n${invoiceText.slice(0, 12000)}`,
        },
      ],
    }),
  })

  const raw = data.choices?.[0]?.message?.content || ''
  const clean = raw.replace(/```json|```/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Sarvam could not structure the extracted invoice data')

  return JSON.parse(jsonMatch[0])
}

/**
 * Extract invoice details using Sarvam Document Intelligence + chat structuring.
 * @param {File} file - image/* or application/pdf
 */
async function extractInvoiceDetails(file) {
  if (!file) throw new Error('Please upload an invoice image or PDF first')
  if (!import.meta.env.VITE_SARVAM_API_KEY) {
    throw new Error('VITE_SARVAM_API_KEY is missing in .env')
  }

  const job = await sarvamFetch('/doc-digitization/job/v1', {
    method: 'POST',
    body: JSON.stringify({
      job_parameters: { language: 'en-IN', output_format: 'md' },
    }),
  })

  const fileName = getFileName(file)
  const uploadLinks = await sarvamFetch('/doc-digitization/job/v1/upload-files', {
    method: 'POST',
    body: JSON.stringify({ job_id: job.job_id, files: [fileName] }),
  })

  const uploadUrl = uploadLinks.upload_urls?.[fileName]?.file_url
  if (!uploadUrl) throw new Error('Sarvam did not provide an upload URL')

  await uploadToPresignedUrl(uploadUrl, file)

  await sarvamFetch(`/doc-digitization/job/v1/${job.job_id}/start`, {
    method: 'POST',
    body: '{}',
  })

  await pollJobStatus(job.job_id)
  const invoiceText = await extractTextFromJob(job.job_id)
  return structureWithChat(invoiceText)
}

export { extractInvoiceDetails, DEMO_DATA }
