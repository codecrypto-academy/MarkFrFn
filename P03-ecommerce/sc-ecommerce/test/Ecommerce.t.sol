// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

// Importar el EuroToken desde la ruta del otro proyecto de Foundry.
// En tests usamos un mock local para no depender del path externo.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../src/CompanyRegistry.sol";
import "../src/ProductCatalog.sol";
import "../src/ShoppingCart.sol";
import "../src/InvoiceSystem.sol";
import "../src/PaymentGateway.sol";
import "../src/EcommerceMain.sol";

/// @dev Mock simple de EuroToken para tests (misma interfaz que el real).
contract MockEuroToken is ERC20 {
    constructor() ERC20("EuroToken", "EURT") {}

    function decimals() public pure override returns (uint8) { return 6; }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract EcommerceTest is Test {
    // ─── Contratos del sistema ─────────────────────────────────────────────────
    MockEuroToken   internal token;
    CompanyRegistry internal companyReg;
    ProductCatalog  internal productCat;
    ShoppingCart    internal cart;
    InvoiceSystem   internal invoiceSys;
    PaymentGateway  internal gateway;
    EcommerceMain   internal main;

    // ─── Actores ──────────────────────────────────────────────────────────────
    address internal deployer = address(this);
    address internal merchant = makeAddr("merchant");
    address internal customer = makeAddr("customer");

    // ─── Constantes ───────────────────────────────────────────────────────────
    uint256 constant ONE_EURT   = 1_000_000;          // 1 EURT
    uint256 constant PRICE_A    = 10 * ONE_EURT;      // 10 EURT
    uint256 constant PRICE_B    = 25 * ONE_EURT;      // 25 EURT
    uint256 constant STOCK_A    = 100;
    uint256 constant STOCK_B    = 50;

    // ─── IDs que se asignan en el setUp ───────────────────────────────────────
    uint256 internal companyId;
    uint256 internal productAId;
    uint256 internal productBId;

    function setUp() public {
        // 1. Desplegar todos los contratos
        token      = new MockEuroToken();
        companyReg = new CompanyRegistry();
        productCat = new ProductCatalog(address(companyReg));
        cart       = new ShoppingCart(address(productCat));
        invoiceSys = new InvoiceSystem(address(cart), address(companyReg));
        gateway    = new PaymentGateway(address(token), address(invoiceSys), address(productCat));
        main       = new EcommerceMain();

        // 2. Conectar contratos
        cart.setInvoiceSystem(address(invoiceSys));
        productCat.setPaymentGateway(address(gateway));
        invoiceSys.setPaymentGateway(address(gateway));

        // 3. Registrar en EcommerceMain
        main.setContracts(
            address(token), address(companyReg), address(productCat),
            address(cart), address(invoiceSys), address(gateway)
        );

        // 4. Registrar empresa (como merchant)
        vm.prank(merchant);
        companyId = companyReg.registerCompany("Tienda Demo", "La mejor tienda");

        // 5. Agregar productos (como merchant)
        vm.startPrank(merchant);
        productAId = productCat.addProduct(companyId, "Producto A", "Desc A", PRICE_A, STOCK_A, "ipfs://A");
        productBId = productCat.addProduct(companyId, "Producto B", "Desc B", PRICE_B, STOCK_B, "ipfs://B");
        vm.stopPrank();

        // 6. Dar tokens al customer para pagar
        token.mint(customer, 1000 * ONE_EURT);
    }

    // ─── COMPANY REGISTRY ─────────────────────────────────────────────────────

    function testRegisterCompany_StoresData() public view {
        CompanyRegistry.Company memory c = companyReg.getCompany(companyId);
        assertEq(c.name, "Tienda Demo");
        assertEq(c.companyAddress, merchant);
        assertTrue(c.isActive);
    }

    function testRegisterCompany_Duplicate_Reverts() public {
        vm.prank(merchant);
        vm.expectRevert(CompanyRegistry.AlreadyRegistered.selector);
        companyReg.registerCompany("Otra tienda", "");
    }

    function testRegisterCompany_EmptyName_Reverts() public {
        vm.prank(customer);
        vm.expectRevert(CompanyRegistry.EmptyName.selector);
        companyReg.registerCompany("", "desc");
    }

    function testIsCompanyOwner() public view {
        assertTrue(companyReg.isCompanyOwner(merchant));
        assertFalse(companyReg.isCompanyOwner(customer));
    }

    // ─── PRODUCT CATALOG ──────────────────────────────────────────────────────

    function testAddProduct_StoresData() public view {
        ProductCatalog.Product memory p = productCat.getProduct(productAId);
        assertEq(p.name, "Producto A");
        assertEq(p.price, PRICE_A);
        assertEq(p.stock, STOCK_A);
        assertEq(p.companyId, companyId);
    }

    function testAddProduct_NotCompanyOwner_Reverts() public {
        vm.prank(customer);
        vm.expectRevert(ProductCatalog.NotCompanyOwner.selector);
        productCat.addProduct(companyId, "Hack", "", PRICE_A, 10, "");
    }

    function testUpdateProduct() public {
        vm.prank(merchant);
        productCat.updateProduct(productAId, 15 * ONE_EURT, 90);
        ProductCatalog.Product memory p = productCat.getProduct(productAId);
        assertEq(p.price, 15 * ONE_EURT);
        assertEq(p.stock, 90);
    }

    function testGetAllProducts_ReturnsBoth() public view {
        ProductCatalog.Product[] memory all = productCat.getAllProducts();
        assertEq(all.length, 2);
    }

    function testGetCompanyProducts() public view {
        ProductCatalog.Product[] memory ps = productCat.getCompanyProducts(companyId);
        assertEq(ps.length, 2);
    }

    // ─── SHOPPING CART ────────────────────────────────────────────────────────

    function testAddToCart_UpdatesCart() public {
        vm.prank(customer);
        cart.addToCart(productAId, 2);

        ShoppingCart.CartItem[] memory items = cart.getCart(customer);
        assertEq(items.length, 1);
        assertEq(items[0].productId, productAId);
        assertEq(items[0].quantity, 2);
        assertEq(items[0].unitPrice, PRICE_A);
    }

    function testAddToCart_CalculatesTotal() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 2); // 2 × 10 = 20
        cart.addToCart(productBId, 1); // 1 × 25 = 25
        vm.stopPrank();

        assertEq(cart.getCartTotal(customer), 45 * ONE_EURT);
    }

    function testAddToCart_ZeroQuantity_Reverts() public {
        vm.prank(customer);
        vm.expectRevert(ShoppingCart.ZeroQuantity.selector);
        cart.addToCart(productAId, 0);
    }

    function testRemoveFromCart() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 1);
        cart.addToCart(productBId, 1);
        cart.removeFromCart(productAId);
        vm.stopPrank();

        ShoppingCart.CartItem[] memory items = cart.getCart(customer);
        assertEq(items.length, 1);
        assertEq(items[0].productId, productBId);
    }

    function testRemoveFromCart_NotInCart_Reverts() public {
        vm.prank(customer);
        vm.expectRevert(ShoppingCart.ProductNotInCart.selector);
        cart.removeFromCart(productAId);
    }

    // ─── INVOICE SYSTEM ───────────────────────────────────────────────────────

    function testCreateInvoice_FromCart() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 2); // 20 EURT
        cart.addToCart(productBId, 1); // 25 EURT
        uint256 invoiceId = invoiceSys.createInvoice(companyId);
        vm.stopPrank();

        InvoiceSystem.Invoice memory inv = invoiceSys.getInvoice(invoiceId);
        assertEq(inv.customerAddress, customer);
        assertEq(inv.companyAddress, merchant);
        assertEq(inv.totalAmount, 45 * ONE_EURT);
        assertFalse(inv.isPaid);
    }

    function testCreateInvoice_ClearsCart() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 1);
        invoiceSys.createInvoice(companyId);
        vm.stopPrank();

        assertEq(cart.getCart(customer).length, 0);
    }

    function testCreateInvoice_EmptyCart_Reverts() public {
        vm.prank(customer);
        vm.expectRevert(InvoiceSystem.EmptyCart.selector);
        invoiceSys.createInvoice(companyId);
    }

    function testGetCustomerInvoices() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 1);
        invoiceSys.createInvoice(companyId);
        vm.stopPrank();

        uint256[] memory ids = invoiceSys.getCustomerInvoices(customer);
        assertEq(ids.length, 1);
    }

    // ─── PAYMENT GATEWAY — FLUJO COMPLETO ─────────────────────────────────────

    function testProcessPayment_TransfersTokens() public {
        uint256 qty = 2;
        uint256 expected = PRICE_A * qty;

        vm.startPrank(customer);
        cart.addToCart(productAId, qty);
        uint256 invoiceId = invoiceSys.createInvoice(companyId);
        token.approve(address(gateway), expected);
        gateway.processPayment(invoiceId);
        vm.stopPrank();

        assertEq(token.balanceOf(merchant), expected);
        assertEq(token.balanceOf(customer), 1000 * ONE_EURT - expected);
    }

    function testProcessPayment_MarksInvoicePaid() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 1);
        uint256 invoiceId = invoiceSys.createInvoice(companyId);
        token.approve(address(gateway), PRICE_A);
        gateway.processPayment(invoiceId);
        vm.stopPrank();

        assertTrue(invoiceSys.getInvoice(invoiceId).isPaid);
    }

    function testProcessPayment_UpdatesStock() public {
        uint256 qty = 3;
        vm.startPrank(customer);
        cart.addToCart(productAId, qty);
        uint256 invoiceId = invoiceSys.createInvoice(companyId);
        token.approve(address(gateway), PRICE_A * qty);
        gateway.processPayment(invoiceId);
        vm.stopPrank();

        assertEq(productCat.getProduct(productAId).stock, STOCK_A - qty);
    }

    function testProcessPayment_AlreadyPaid_Reverts() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 1);
        uint256 invoiceId = invoiceSys.createInvoice(companyId);
        token.approve(address(gateway), PRICE_A * 2);
        gateway.processPayment(invoiceId);
        vm.expectRevert(PaymentGateway.AlreadyPaid.selector);
        gateway.processPayment(invoiceId);
        vm.stopPrank();
    }

    function testProcessPayment_WrongCustomer_Reverts() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 1);
        uint256 invoiceId = invoiceSys.createInvoice(companyId);
        vm.stopPrank();

        address other = makeAddr("other");
        token.mint(other, 100 * ONE_EURT);
        vm.startPrank(other);
        token.approve(address(gateway), PRICE_A);
        vm.expectRevert(PaymentGateway.WrongCustomer.selector);
        gateway.processPayment(invoiceId);
        vm.stopPrank();
    }

    function testProcessPayment_InsufficientAllowance_Reverts() public {
        vm.startPrank(customer);
        cart.addToCart(productAId, 1);
        uint256 invoiceId = invoiceSys.createInvoice(companyId);
        // Sin approve
        vm.expectRevert();
        gateway.processPayment(invoiceId);
        vm.stopPrank();
    }

    // ─── ECOMMERCE MAIN ───────────────────────────────────────────────────────

    function testEcommerceMain_GetAllProducts() public view {
        ProductCatalog.Product[] memory ps = main.getAllProducts();
        assertEq(ps.length, 2);
    }

    function testEcommerceMain_GetCart() public {
        vm.prank(customer);
        cart.addToCart(productAId, 1);
        ShoppingCart.CartItem[] memory items = main.getCart(customer);
        assertEq(items.length, 1);
    }

    function testEcommerceMain_GetCompanyByAddress() public view {
        CompanyRegistry.Company memory c = main.getCompanyByAddress(merchant);
        assertEq(c.name, "Tienda Demo");
    }
}
