// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title EuroToken (EURT) — Stablecoin anclada al euro
/// @notice 1 EURT = 1 EUR. Decimals: 6 (representación en centavos).
///         Solo el owner puede acuñar tokens (mint).
contract EuroToken is ERC20 {
    address public owner;

    error NotOwner();
    error ZeroAddress();
    error ZeroAmount();

    event Minted(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() ERC20("EuroToken", "EURT") {
        owner = msg.sender;
    }

    /// @notice Retorna 6 decimales (centavos de euro).
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Acuña `amount` tokens EURT a la dirección `to`. Solo owner.
    /// @param to      Destinatario de los tokens.
    /// @param amount  Cantidad en unidades mínimas (1 EURT = 1_000_000).
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /// @notice Transfiere la propiedad del contrato a una nueva dirección.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
