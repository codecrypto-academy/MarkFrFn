// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

/**
 * @notice Despliega MinimalForwarder y DAOVoting en orden.
 *         DAOVoting recibe la dirección del forwarder como trusted forwarder (ERC-2771).
 *
 * Uso (red local Anvil):
 *   forge script script/Deploy.s.sol \
 *     --rpc-url http://localhost:8545 \
 *     --broadcast \
 *     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        vm.startBroadcast(deployerKey);

        MinimalForwarder forwarder = new MinimalForwarder();
        DAOVoting dao = new DAOVoting(address(forwarder));

        vm.stopBroadcast();

        console.log("MinimalForwarder:", address(forwarder));
        console.log("DAOVoting:       ", address(dao));
    }
}
