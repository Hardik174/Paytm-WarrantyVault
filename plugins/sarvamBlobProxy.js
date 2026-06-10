/**
 * Proxies Azure blob upload/download server-side to avoid browser CORS blocks.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function attachBlobProxy(app) {
  app.use('/api/sarvam/blob-upload', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    try {
      const raw = await readBody(req)
      const { uploadUrl, contentType, fileBase64 } = JSON.parse(raw.toString())

      if (!uploadUrl || !fileBase64) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'uploadUrl and fileBase64 are required' }))
        return
      }

      const buffer = Buffer.from(fileBase64, 'base64')
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Length': String(buffer.length),
        },
        body: buffer,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        res.statusCode = response.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `Azure upload failed (${response.status}): ${text.slice(0, 200)}` }))
        return
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true }))
    } catch (err) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err.message || 'Blob upload proxy failed' }))
    }
  })

  app.use('/api/sarvam/blob-download', async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    try {
      const url = new URL(req.url, 'http://localhost')
      const blobUrl = url.searchParams.get('url')

      if (!blobUrl) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'url query param is required' }))
        return
      }

      const response = await fetch(blobUrl)
      if (!response.ok) {
        res.statusCode = response.status
        res.end(JSON.stringify({ error: `Azure download failed (${response.status})` }))
        return
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      res.statusCode = 200
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/zip')
      res.end(buffer)
    } catch (err) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err.message || 'Blob download proxy failed' }))
    }
  })
}

export function sarvamBlobProxy() {
  return {
    name: 'sarvam-blob-proxy',
    configureServer(server) {
      attachBlobProxy(server.middlewares)
    },
    configurePreviewServer(server) {
      attachBlobProxy(server.middlewares)
    },
  }
}
