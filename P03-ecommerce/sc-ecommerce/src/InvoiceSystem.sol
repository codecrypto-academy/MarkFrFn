// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ShoppingCart.sol";
import "./CompanyRegistry.sol";

/// @title InvoiceSystem — Gestión de facturas del e-commerce
contract InvoiceSystem {
    struct InvoiceItem {
        uint256 productId;
        string productName;
        uint256 quantity;
        uint256 unitPrice;
        uint256 totalPrice;
    }

    struct Invoice {
        uint256 invoiceId;
        uint256 companyId;
        address companyAddress;
        address customerAddress;
        uint256 totalAmount;
        uint256 timestamp;
        bool isPaid;
        bytes32 paymentTxHash;
    }

    error EmptyCart();
    error InvoiceNotFound();
    error AlreadyPaid();
    error NotAuthorized();

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed customer,
        uint256 indexed companyId,
        uint256 totalAmount
    );
    event InvoicePaid(uint256 indexed invoiceId, address indexed customer, bytes32 txHash);

    ShoppingCart public immutable cart;
    CompanyRegistry public immutable companyRegistry;
    address public paymentGateway;

    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => InvoiceItem[]) public invoiceItems;
    mapping(address => uint256[]) private customerInvoices;
    mapping(uint256 => uint256[]) private companyInvoiceIds;
    uint256 public invoiceCount;

    constructor(address _cart, address _companyRegistry) {
        cart = ShoppingCart(_cart);
        companyRegistry = CompanyRegistry(_companyRegistry);
    }

    /// @notice Establece la dirección del PaymentGateway (solo una vez).
    function setPaymentGateway(address _gateway) external {
        require(paymentGateway == address(0), "Already set");
        paymentGateway = _gateway;
    }

    /// @notice Crea una factura desde el carrito actual del caller.
    ///         El carrito se vacía automáticamente.
    /// @param companyId ID de la empresa a la que se paga.
    function createInvoice(uint256 companyId) external returns (uint256) {
        ShoppingCart.CartItem[] memory items = cart.getCart(msg.sender);
        if (items.length == 0) revert EmptyCart();

        CompanyRegistry.Company memory company = companyRegistry.getCompany(companyId);

        invoiceCount++;
        uint256 newId = invoiceCount;
        uint256 total = 0;

        // Copiar items al storage de la factura
        for (uint256 i = 0; i < items.length; i++) {
            uint256 itemTotal = items[i].unitPrice * items[i].quantity;
            total += itemTotal;
            invoiceItems[newId].push(InvoiceItem({
                productId: items[i].productId,
                productName: "",        // se puede enriquecer desde el frontend
                quantity: items[i].quantity,
                unitPrice: items[i].unitPrice,
                totalPrice: itemTotal
            }));
        }

        invoices[newId] = Invoice({
            invoiceId: newId,
            companyId: companyId,
            companyAddress: company.companyAddress,
            customerAddress: msg.sender,
            totalAmount: total,
            timestamp: block.timestamp,
            isPaid: false,
            paymentTxHash: bytes32(0)
        });

        customerInvoices[msg.sender].push(newId);
        companyInvoiceIds[companyId].push(newId);

        // Vaciar carrito
        cart.clearCart(msg.sender);

        emit InvoiceCreated(newId, msg.sender, companyId, total);
        return newId;
    }

    /// @notice Marca una factura como pagada. Solo PaymentGateway.
    function markAsPaid(uint256 invoiceId, bytes32 txHash) external {
        if (msg.sender != paymentGateway) revert NotAuthorized();
        Invoice storage inv = invoices[invoiceId];
        if (inv.customerAddress == address(0)) revert InvoiceNotFound();
        if (inv.isPaid) revert AlreadyPaid();

        inv.isPaid = true;
        inv.paymentTxHash = txHash;

        emit InvoicePaid(invoiceId, inv.customerAddress, txHash);
    }

    /// @notice Obtiene una factura por ID.
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        if (invoices[invoiceId].customerAddress == address(0)) revert InvoiceNotFound();
        return invoices[invoiceId];
    }

    /// @notice Obtiene los items de una factura.
    function getInvoiceItems(uint256 invoiceId) external view returns (InvoiceItem[] memory) {
        return invoiceItems[invoiceId];
    }

    /// @notice IDs de facturas de un customer.
    function getCustomerInvoices(address customer) external view returns (uint256[] memory) {
        return customerInvoices[customer];
    }

    /// @notice IDs de facturas de una empresa.
    function getCompanyInvoices(uint256 companyId) external view returns (uint256[] memory) {
        return companyInvoiceIds[companyId];
    }
}
