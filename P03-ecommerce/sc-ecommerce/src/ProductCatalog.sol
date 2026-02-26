// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CompanyRegistry.sol";

/// @title ProductCatalog — Catálogo de productos del e-commerce
contract ProductCatalog {
    struct Product {
        uint256 productId;
        uint256 companyId;
        address companyAddress;
        string name;
        string description;
        uint256 price;          // En unidades mínimas EURT (6 decimals)
        uint256 stock;
        string ipfsImageHash;
        bool isActive;
        uint256 createdAt;
    }

    error NotCompanyOwner();
    error ProductNotFound();
    error InsufficientStock();
    error NotAuthorized();
    error EmptyName();
    error ZeroPrice();

    event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price);
    event ProductUpdated(uint256 indexed productId, uint256 price, uint256 stock);
    event StockDecreased(uint256 indexed productId, uint256 quantity, uint256 remaining);

    CompanyRegistry public immutable companyRegistry;
    address public paymentGateway; // establecido tras deploy

    mapping(uint256 => Product) public products;
    mapping(uint256 => uint256[]) private companyProductIds; // companyId → productIds
    uint256 public productCount;

    constructor(address _companyRegistry) {
        companyRegistry = CompanyRegistry(_companyRegistry);
    }

    modifier onlyProductOwner(uint256 productId) {
        if (products[productId].companyAddress != msg.sender) revert NotCompanyOwner();
        _;
    }

    /// @notice Establece la dirección del PaymentGateway (solo una vez, después del deploy).
    function setPaymentGateway(address _gateway) external {
        require(paymentGateway == address(0), "Already set");
        paymentGateway = _gateway;
    }

    /// @notice Agrega un producto al catálogo. Solo el owner de la empresa puede hacerlo.
    function addProduct(
        uint256 companyId,
        string calldata name,
        string calldata description,
        uint256 price,
        uint256 stock,
        string calldata ipfsImageHash
    ) external returns (uint256) {
        CompanyRegistry.Company memory company = companyRegistry.getCompany(companyId);
        if (company.companyAddress != msg.sender) revert NotCompanyOwner();
        if (bytes(name).length == 0) revert EmptyName();
        if (price == 0) revert ZeroPrice();

        productCount++;
        uint256 newId = productCount;

        products[newId] = Product({
            productId: newId,
            companyId: companyId,
            companyAddress: msg.sender,
            name: name,
            description: description,
            price: price,
            stock: stock,
            ipfsImageHash: ipfsImageHash,
            isActive: true,
            createdAt: block.timestamp
        });
        companyProductIds[companyId].push(newId);

        emit ProductAdded(newId, companyId, name, price);
        return newId;
    }

    /// @notice Actualiza precio y stock de un producto (solo owner de la empresa).
    function updateProduct(uint256 productId, uint256 price, uint256 stock)
        external
        onlyProductOwner(productId)
    {
        if (price == 0) revert ZeroPrice();
        products[productId].price = price;
        products[productId].stock = stock;
        emit ProductUpdated(productId, price, stock);
    }

    /// @notice Decrece el stock tras una compra. Solo PaymentGateway puede llamarlo.
    function decreaseStock(uint256 productId, uint256 quantity) external {
        if (msg.sender != paymentGateway) revert NotAuthorized();
        if (products[productId].stock < quantity) revert InsufficientStock();
        products[productId].stock -= quantity;
        emit StockDecreased(productId, quantity, products[productId].stock);
    }

    /// @notice Retorna todos los productos activos del catálogo.
    function getAllProducts() external view returns (Product[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= productCount; i++) {
            if (products[i].isActive) activeCount++;
        }
        Product[] memory result = new Product[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= productCount; i++) {
            if (products[i].isActive) result[idx++] = products[i];
        }
        return result;
    }

    /// @notice Retorna los productos de una empresa específica.
    function getCompanyProducts(uint256 companyId) external view returns (Product[] memory) {
        uint256[] memory ids = companyProductIds[companyId];
        Product[] memory result = new Product[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = products[ids[i]];
        }
        return result;
    }

    /// @notice Obtiene un producto por ID.
    function getProduct(uint256 productId) external view returns (Product memory) {
        if (products[productId].companyAddress == address(0)) revert ProductNotFound();
        return products[productId];
    }
}
