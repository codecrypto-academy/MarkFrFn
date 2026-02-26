// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/CompanyRegistry.sol";
import "../src/ProductCatalog.sol";
import "../src/ShoppingCart.sol";
import "../src/InvoiceSystem.sol";
import "../src/PaymentGateway.sol";
import "../src/EcommerceMain.sol";

/// @notice Deploy de todos los contratos e-commerce en el orden correcto.
///         Requiere EURO_TOKEN_ADDRESS en el entorno o usa la dirección por defecto de Anvil.
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        // Dirección del EuroToken ya desplegado (stablecoin/sc)
        address euroTokenAddr = vm.envOr(
            "EURO_TOKEN_ADDRESS",
            address(0x5FbDB2315678afecb367f032d93F642f64180aa3) // default Anvil deploy 1
        );

        vm.startBroadcast(deployerKey);

        // 1. CompanyRegistry (autónomo)
        CompanyRegistry companyReg = new CompanyRegistry();

        // 2. ProductCatalog (depende de CompanyRegistry)
        ProductCatalog productCat = new ProductCatalog(address(companyReg));

        // 3. ShoppingCart (depende de ProductCatalog)
        ShoppingCart cart = new ShoppingCart(address(productCat));

        // 4. InvoiceSystem (depende de ShoppingCart + CompanyRegistry)
        InvoiceSystem invoiceSys = new InvoiceSystem(address(cart), address(companyReg));

        // 5. PaymentGateway (depende de EuroToken + InvoiceSystem + ProductCatalog)
        PaymentGateway gateway = new PaymentGateway(
            euroTokenAddr,
            address(invoiceSys),
            address(productCat)
        );

        // 6. EcommerceMain — coordinador
        EcommerceMain main = new EcommerceMain();

        // ─── Conectar contratos entre sí ──────────────────────────────────────
        cart.setInvoiceSystem(address(invoiceSys));
        productCat.setPaymentGateway(address(gateway));
        invoiceSys.setPaymentGateway(address(gateway));

        // ─── Registrar todo en EcommerceMain ──────────────────────────────────
        main.setContracts(
            euroTokenAddr,
            address(companyReg),
            address(productCat),
            address(cart),
            address(invoiceSys),
            address(gateway)
        );

        vm.stopBroadcast();

        // ─── Salida legible para start.sh ─────────────────────────────────────
        console.log("EcommerceMain:   ", address(main));
        console.log("CompanyRegistry: ", address(companyReg));
        console.log("ProductCatalog:  ", address(productCat));
        console.log("ShoppingCart:    ", address(cart));
        console.log("InvoiceSystem:   ", address(invoiceSys));
        console.log("PaymentGateway:  ", address(gateway));
        console.log("EuroToken:       ", euroTokenAddr);
    }
}
