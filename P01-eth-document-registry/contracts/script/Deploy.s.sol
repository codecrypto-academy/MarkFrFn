// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/DocumentRegistry.sol";

contract DeployDocumentRegistry is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        DocumentRegistry registry = new DocumentRegistry();
        vm.stopBroadcast();
        console.log("Deployed DocumentRegistry at:", address(registry));
        return address(registry);
    }
}
