// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./InvoiceSystem.sol";
import "./ProductCatalog.sol";

/// @title PaymentGateway — Procesador de pagos con EuroToken
/// @notice El customer debe haber llamado `EuroToken.approve(paymentGateway, amount)`
///         antes de llamar a processPayment.
contract PaymentGateway {
    error InvoiceNotFound();
    error AlreadyPaid();
    error WrongCustomer();
    error TransferFailed();
    error InvoiceAmountMismatch();

    event PaymentProcessed(
        uint256 indexed invoiceId,
        address indexed customer,
        address indexed company,
        uint256 amount
    );

    IERC20 public immutable euroToken;
    InvoiceSystem public immutable invoiceSystem;
    ProductCatalog public immutable productCatalog;

    constructor(address _euroToken, address _invoiceSystem, address _productCatalog) {
        euroToken = IERC20(_euroToken);
        invoiceSystem = InvoiceSystem(_invoiceSystem);
        productCatalog = ProductCatalog(_productCatalog);
    }

    /// @notice Procesa el pago de una factura.
    ///         Transfiere tokens del customer a la empresa, marca la factura como pagada
    ///         y descuenta el stock de cada producto.
    /// @param invoiceId ID de la factura a pagar.
    function processPayment(uint256 invoiceId) external {
        InvoiceSystem.Invoice memory inv = invoiceSystem.getInvoice(invoiceId);
        if (inv.customerAddress == address(0)) revert InvoiceNotFound();
        if (inv.isPaid) revert AlreadyPaid();
        if (inv.customerAddress != msg.sender) revert WrongCustomer();

        // Transferir tokens del customer a la empresa
        bool ok = euroToken.transferFrom(msg.sender, inv.companyAddress, inv.totalAmount);
        if (!ok) revert TransferFailed();

        // Marcar factura como pagada (txHash = hash del bloque actual como referencia)
        bytes32 txHash = keccak256(abi.encodePacked(invoiceId, msg.sender, block.number));
        invoiceSystem.markAsPaid(invoiceId, txHash);

        // Descontar stock de cada producto
        InvoiceSystem.InvoiceItem[] memory items = invoiceSystem.getInvoiceItems(invoiceId);
        for (uint256 i = 0; i < items.length; i++) {
            productCatalog.decreaseStock(items[i].productId, items[i].quantity);
        }

        emit PaymentProcessed(invoiceId, msg.sender, inv.companyAddress, inv.totalAmount);
    }
}
