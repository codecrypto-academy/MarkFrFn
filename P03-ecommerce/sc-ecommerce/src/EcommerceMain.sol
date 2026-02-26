// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CompanyRegistry.sol";
import "./ProductCatalog.sol";
import "./ShoppingCart.sol";
import "./InvoiceSystem.sol";
import "./PaymentGateway.sol";

/// @title EcommerceMain — Punto de entrada único para el frontend
/// @notice Actúa como registro de contratos y ofrece funciones de conveniencia
///         que agregan datos de múltiples sub-contratos en una sola llamada.
contract EcommerceMain {
    address public owner;

    address public euroToken;
    address public companyRegistry;
    address public productCatalog;
    address public shoppingCart;
    address public invoiceSystem;
    address public paymentGateway;

    error NotOwner();

    event ContractsRegistered(
        address euroToken,
        address companyRegistry,
        address productCatalog,
        address shoppingCart,
        address invoiceSystem,
        address paymentGateway
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Registra las addresses de todos los sub-contratos del sistema.
    ///         Solo el owner puede llamarlo.
    function setContracts(
        address _euroToken,
        address _companyRegistry,
        address _productCatalog,
        address _shoppingCart,
        address _invoiceSystem,
        address _paymentGateway
    ) external onlyOwner {
        euroToken       = _euroToken;
        companyRegistry = _companyRegistry;
        productCatalog  = _productCatalog;
        shoppingCart    = _shoppingCart;
        invoiceSystem   = _invoiceSystem;
        paymentGateway  = _paymentGateway;

        emit ContractsRegistered(
            _euroToken, _companyRegistry, _productCatalog,
            _shoppingCart, _invoiceSystem, _paymentGateway
        );
    }

    // ─── Conveniencia: delegar al frontend solo necesita esta address ─────────

    function getAllProducts() external view returns (ProductCatalog.Product[] memory) {
        return ProductCatalog(productCatalog).getAllProducts();
    }

    function getCompanyProducts(uint256 companyId) external view returns (ProductCatalog.Product[] memory) {
        return ProductCatalog(productCatalog).getCompanyProducts(companyId);
    }

    function getCart(address customer) external view returns (ShoppingCart.CartItem[] memory) {
        return ShoppingCart(shoppingCart).getCart(customer);
    }

    function getCartTotal(address customer) external view returns (uint256) {
        return ShoppingCart(shoppingCart).getCartTotal(customer);
    }

    function getInvoice(uint256 invoiceId) external view returns (InvoiceSystem.Invoice memory) {
        return InvoiceSystem(invoiceSystem).getInvoice(invoiceId);
    }

    function getCustomerInvoices(address customer) external view returns (uint256[] memory) {
        return InvoiceSystem(invoiceSystem).getCustomerInvoices(customer);
    }

    function getCompanyInvoices(uint256 companyId) external view returns (uint256[] memory) {
        return InvoiceSystem(invoiceSystem).getCompanyInvoices(companyId);
    }

    function getCompany(uint256 companyId) external view returns (CompanyRegistry.Company memory) {
        return CompanyRegistry(companyRegistry).getCompany(companyId);
    }

    function getCompanyByAddress(address addr) external view returns (CompanyRegistry.Company memory) {
        return CompanyRegistry(companyRegistry).getCompanyByAddress(addr);
    }
}
