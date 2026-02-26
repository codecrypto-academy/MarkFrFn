// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "openzeppelin-contracts/utils/cryptography/ECDSA.sol";

/// @title Document Registry
/// @notice Registro de hashes de documentos con firmas ECDSA
/// @dev Optimizado: sin campo `exists` redundante, se usa signer != address(0) para verificar existencia
contract DocumentRegistry {
    using ECDSA for bytes32;

    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer;
        bytes signature;
    }

    mapping(bytes32 => Document) private documents;
    bytes32[] private documentHashes;

    event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp, bytes signature);
    event DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid);

    modifier documentNotExists(bytes32 _hash) {
        require(documents[_hash].signer == address(0), "Document already exists");
        _;
    }

    modifier documentExists(bytes32 _hash) {
        require(documents[_hash].signer != address(0), "Document does not exist");
        _;
    }

    /// @notice Almacena el hash de un documento junto con timestamp y firma
    /// @dev La firma debe ser del mensaje `hash` firmado con `eth_sign` prefijo
    function storeDocumentHash(bytes32 hash, uint256 timestamp, bytes calldata signature) external documentNotExists(hash) {
        require(hash != bytes32(0), "Invalid hash");

        bytes32 ethSigned = ECDSA.toEthSignedMessageHash(abi.encodePacked(hash));
        address recovered = ethSigned.recover(signature);
        require(recovered != address(0), "Invalid signature");

        documents[hash] = Document({
            hash: hash,
            timestamp: timestamp,
            signer: recovered,
            signature: signature
        });
        documentHashes.push(hash);

        emit DocumentStored(hash, recovered, timestamp, signature);
    }

    /// @notice Verifica que una firma corresponde al `signer` para un `hash`
    /// @return isValid True si la firma es válida y coincide con `signer`
    function verifyDocument(bytes32 hash, address signer, bytes calldata signature) external returns (bool isValid) {
        if (documents[hash].signer == address(0)) {
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        bytes32 ethSigned = ECDSA.toEthSignedMessageHash(abi.encodePacked(hash));
        address recovered = ethSigned.recover(signature);
        isValid = (recovered == signer);

        emit DocumentVerified(hash, signer, isValid);
        return isValid;
    }

    /// @notice Obtiene la información completa de un documento almacenado
    function getDocumentInfo(bytes32 hash) external view documentExists(hash) returns (Document memory) {
        return documents[hash];
    }

    /// @notice Comprueba si un documento está almacenado
    function isDocumentStored(bytes32 hash) external view returns (bool) {
        return documents[hash].signer != address(0);
    }

    /// @notice Devuelve el número total de documentos almacenados
    function getDocumentCount() external view returns (uint256) {
        return documentHashes.length;
    }

    /// @notice Devuelve el hash de un documento por su índice
    function getDocumentHashByIndex(uint256 index) external view returns (bytes32) {
        require(index < documentHashes.length, "Index out of bounds");
        return documentHashes[index];
    }

    /// @notice Devuelve la firma almacenada para un documento
    function getDocumentSignature(bytes32 hash) external view documentExists(hash) returns (bytes memory) {
        return documents[hash].signature;
    }
}
