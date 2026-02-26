// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Escrow.sol";
import "../src/TestToken.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        vm.startBroadcast(deployerKey);

        // 1. Desplegar contrato principal
        Escrow escrow = new Escrow();

        // 2. Desplegar tokens de prueba
        TestToken tokenA = new TestToken("TokenA", "TKA");
        TestToken tokenB = new TestToken("TokenB", "TKB");

        // 3. Autorizar tokens en el escrow
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));

        // 4. Mintear 1000 de cada token a las 3 cuentas de prueba de Anvil
        address[3] memory testAccounts = [
            0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, // account #0 (deployer/owner)
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8, // account #1
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC  // account #2
        ];
        for (uint256 i = 0; i < testAccounts.length; i++) {
            tokenA.mint(testAccounts[i], 1_000 * 1e18);
            tokenB.mint(testAccounts[i], 1_000 * 1e18);
        }

        vm.stopBroadcast();

        // 5. Imprimir addresses para start.sh
        console.log("Escrow: ", address(escrow));
        console.log("TokenA: ", address(tokenA));
        console.log("TokenB: ", address(tokenB));
    }
}
