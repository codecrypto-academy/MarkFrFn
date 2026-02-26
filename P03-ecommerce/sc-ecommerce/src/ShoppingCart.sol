// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProductCatalog.sol";

/// @title ShoppingCart — Carrito de compras en blockchain
contract ShoppingCart {
    struct CartItem {
        uint256 productId;
        uint256 quantity;
        uint256 unitPrice;  // precio capturado al agregar al carrito
    }

    error ProductNotActive();
    error InsufficientStock();
    error ProductNotInCart();
    error NotAuthorized();
    error ZeroQuantity();

    event ItemAdded(address indexed customer, uint256 indexed productId, uint256 quantity);
    event ItemRemoved(address indexed customer, uint256 indexed productId);
    event CartCleared(address indexed customer);

    ProductCatalog public immutable productCatalog;
    address public invoiceSystem; // establecido tras deploy

    // customer → lista de cart items
    mapping(address => CartItem[]) private carts;
    // customer → productId → index+1 en carts[customer] (0 = no existe)
    mapping(address => mapping(uint256 => uint256)) private cartIndex;

    constructor(address _productCatalog) {
        productCatalog = ProductCatalog(_productCatalog);
    }

    modifier onlyInvoiceSystem() {
        if (msg.sender != invoiceSystem) revert NotAuthorized();
        _;
    }

    /// @notice Establece la dirección del InvoiceSystem (solo una vez).
    function setInvoiceSystem(address _invoiceSystem) external {
        require(invoiceSystem == address(0), "Already set");
        invoiceSystem = _invoiceSystem;
    }

    /// @notice Agrega o actualiza un item en el carrito del caller.
    function addToCart(uint256 productId, uint256 quantity) external {
        if (quantity == 0) revert ZeroQuantity();

        ProductCatalog.Product memory product = productCatalog.getProduct(productId);
        if (!product.isActive) revert ProductNotActive();
        if (product.stock < quantity) revert InsufficientStock();

        uint256 idx = cartIndex[msg.sender][productId];
        if (idx == 0) {
            // Nuevo item
            carts[msg.sender].push(CartItem({
                productId: productId,
                quantity: quantity,
                unitPrice: product.price
            }));
            cartIndex[msg.sender][productId] = carts[msg.sender].length; // index+1
        } else {
            // Actualizar cantidad
            carts[msg.sender][idx - 1].quantity = quantity;
            carts[msg.sender][idx - 1].unitPrice = product.price;
        }
        emit ItemAdded(msg.sender, productId, quantity);
    }

    /// @notice Elimina un producto del carrito del caller.
    function removeFromCart(uint256 productId) external {
        uint256 idx = cartIndex[msg.sender][productId];
        if (idx == 0) revert ProductNotInCart();

        uint256 lastIdx = carts[msg.sender].length;
        if (idx != lastIdx) {
            // Mover el último al lugar del eliminado
            CartItem memory last = carts[msg.sender][lastIdx - 1];
            carts[msg.sender][idx - 1] = last;
            cartIndex[msg.sender][last.productId] = idx;
        }
        carts[msg.sender].pop();
        delete cartIndex[msg.sender][productId];

        emit ItemRemoved(msg.sender, productId);
    }

    /// @notice Limpia el carrito de un customer. Solo InvoiceSystem.
    function clearCart(address customer) external onlyInvoiceSystem {
        CartItem[] storage items = carts[customer];
        for (uint256 i = 0; i < items.length; i++) {
            delete cartIndex[customer][items[i].productId];
        }
        delete carts[customer];
        emit CartCleared(customer);
    }

    /// @notice Retorna todos los items del carrito de un customer.
    function getCart(address customer) external view returns (CartItem[] memory) {
        return carts[customer];
    }

    /// @notice Calcula el total del carrito en EURT (unidades mínimas).
    function getCartTotal(address customer) external view returns (uint256) {
        CartItem[] storage items = carts[customer];
        uint256 total = 0;
        for (uint256 i = 0; i < items.length; i++) {
            total += items[i].unitPrice * items[i].quantity;
        }
        return total;
    }
}
