// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/EuroToken.sol";

contract Deploy is Script {
    // Mint inicial: 1_000_000 EURT al deployer para pruebas
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1_000_000; // 1M EURT (6 decimals)

    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        EuroToken token = new EuroToken();
        token.mint(deployer, INITIAL_SUPPLY);

        vm.stopBroadcast();

        console.log("EuroToken:", address(token));
        console.log("Owner:    ", deployer);
        console.log("Supply:   ", INITIAL_SUPPLY / 1_000_000, "EURT");
    }
}
