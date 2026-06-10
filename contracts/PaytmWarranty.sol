// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaytmWarranty is ERC721Enumerable, Ownable {
    enum WarrantyStatus {
        ACTIVE,
        EXPIRED,
        CLAIMED
    }

    struct MintWarrantyInput {
        string paytmTxnId;
        string productName;
        string productSerial;
        string brand;
        string modelNumber;
        address customerAddress;
        uint256 purchaseAmount;
        uint256 warrantyMonths;
    }

    struct WarrantyData {
        string paytmTxnId;
        string productName;
        string productSerial;
        string brand;
        string modelNumber;
        address customerAddress;
        uint256 purchaseAmount;
        uint256 warrantyMonths;
        uint256 purchaseDate;
        uint256 expiryDate;
        WarrantyStatus status;
        string vendorName;
    }

    struct VendorInfo {
        bool registered;
        string name;
    }

    mapping(uint256 => WarrantyData) private _warranties;
    mapping(address => VendorInfo) public vendors;
    mapping(string => bool) public usedTxnIds;

    uint256 private _nextTokenId;

    event WarrantyMinted(
        uint256 indexed tokenId,
        address indexed customer,
        string paytmTxnId
    );
    event WarrantyClaimed(uint256 indexed tokenId, address indexed claimant);
    event VendorRegistered(address indexed vendor, string name);

    constructor() ERC721("PaytmWarranty", "PWARRANTY") {
        _registerVendor(msg.sender, "Croma Electronics, Andheri West");
    }

    function registerVendor(address vendor, string calldata name) external onlyOwner {
        _registerVendor(vendor, name);
    }

    function _registerVendor(address vendor, string memory name) internal {
        require(vendor != address(0), "Invalid vendor");
        vendors[vendor] = VendorInfo({registered: true, name: name});
        emit VendorRegistered(vendor, name);
    }

    function mintWarranty(MintWarrantyInput calldata input) external returns (uint256 tokenId) {
        require(vendors[msg.sender].registered, "Not a registered vendor");
        require(bytes(input.paytmTxnId).length > 0, "Txn ID required");
        require(!usedTxnIds[input.paytmTxnId], "Txn ID already used");
        require(input.customerAddress != address(0), "Invalid customer");
        require(input.purchaseAmount > 0, "Amount must be > 0");
        require(input.warrantyMonths > 0 && input.warrantyMonths <= 120, "Invalid warranty period");

        usedTxnIds[input.paytmTxnId] = true;

        tokenId = _nextTokenId++;
        uint256 purchaseDate = block.timestamp;
        uint256 expiryDate = purchaseDate + (input.warrantyMonths * 30 days);

        _warranties[tokenId] = WarrantyData({
            paytmTxnId: input.paytmTxnId,
            productName: input.productName,
            productSerial: input.productSerial,
            brand: input.brand,
            modelNumber: input.modelNumber,
            customerAddress: input.customerAddress,
            purchaseAmount: input.purchaseAmount,
            warrantyMonths: input.warrantyMonths,
            purchaseDate: purchaseDate,
            expiryDate: expiryDate,
            status: WarrantyStatus.ACTIVE,
            vendorName: vendors[msg.sender].name
        });

        _safeMint(input.customerAddress, tokenId);
        emit WarrantyMinted(tokenId, input.customerAddress, input.paytmTxnId);
    }

    function getWarranty(uint256 tokenId) external view returns (WarrantyData memory) {
        require(_exists(tokenId), "Token does not exist");
        return _warranties[tokenId];
    }

    function claimWarranty(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not warranty owner");
        WarrantyData storage w = _warranties[tokenId];
        require(w.status == WarrantyStatus.ACTIVE, "Warranty not active");
        w.status = WarrantyStatus.CLAIMED;
        emit WarrantyClaimed(tokenId, msg.sender);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        WarrantyData memory w = _warranties[tokenId];
        return string(
            abi.encodePacked(
                "PaytmWarranty:",
                w.productName,
                " (",
                w.brand,
                ")"
            )
        );
    }
}
