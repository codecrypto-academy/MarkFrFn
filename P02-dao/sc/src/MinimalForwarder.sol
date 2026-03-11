// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MinimalForwarder
 * @notice Relayer de meta-transacciones compatible con ERC-2771.
 *         Permite que usuarios firmen transacciones off-chain y un relayer
 *         las ejecute en su nombre pagando el gas.
 *
 * Flujo:
 *   1. Usuario construye ForwardRequest y la firma con EIP-712
 *   2. Relayer llama execute() con la request + firma
 *   3. Forwarder verifica la firma, incrementa el nonce y llama al contrato destino
 *      inyectando la dirección original del usuario al final del calldata (ERC-2771)
 */
contract MinimalForwarder is EIP712 {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;    // Usuario original que firma
        address to;      // Contrato destino (DAOVoting)
        uint256 value;   // ETH a enviar (0 en votación)
        uint256 gas;     // Límite de gas para la sub-llamada
        uint256 nonce;   // Nonce actual del usuario (anti-replay)
        bytes   data;    // ABI-encoded calldata de la función destino
    }

    // Typehash del struct para EIP-712
    bytes32 private constant _TYPEHASH = keccak256(
        "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
    );

    // Nonce por usuario — previene ataques de replay
    mapping(address => uint256) private _nonces;

    constructor() EIP712("MinimalForwarder", "1") {}

    // ─── Lectura ────────────────────────────────────────────────────────────

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    /**
     * @notice Verifica que la firma corresponde al usuario declarado y que el nonce es correcto.
     */
    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(abi.encode(
                _TYPEHASH,
                req.from,
                req.to,
                req.value,
                req.gas,
                req.nonce,
                keccak256(req.data)
            ))
        ).recover(signature);

        return _nonces[req.from] == req.nonce && signer == req.from;
    }

    // ─── Ejecución ──────────────────────────────────────────────────────────

    /**
     * @notice Ejecuta la meta-transacción.
     *         Añade req.from al final del calldata para que el contrato destino
     *         pueda recuperar al usuario original mediante _msgSender() (ERC-2771).
     */
    function execute(
        ForwardRequest calldata req,
        bytes calldata signature
    ) public payable returns (bool success, bytes memory returndata) {
        require(verify(req, signature), "MinimalForwarder: invalid signature");

        _nonces[req.from] = req.nonce + 1;

        (success, returndata) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );

        // Garantiza que el relayer pasó suficiente gas (protección EIP-150)
        assert(gasleft() > req.gas / 63);
    }
}
