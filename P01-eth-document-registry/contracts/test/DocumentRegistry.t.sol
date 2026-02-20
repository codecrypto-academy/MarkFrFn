// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "openzeppelin-contracts/utils/cryptography/ECDSA.sol";
import "../src/DocumentRegistry.sol";

contract DocumentRegistryTest is Test {
    using ECDSA for bytes32;

    DocumentRegistry registry;

    // Dos claves privadas de Anvil para tests multi-wallet
    uint256 privateKey  = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 privateKey2 = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;

    function setUp() public {
        registry = new DocumentRegistry();
    }

    // ─────────────────────────────────────────────────────────
    // Helper: firma un hash con una clave privada dada
    // ─────────────────────────────────────────────────────────
    function _sign(bytes32 docHash, uint256 key) internal returns (bytes memory) {
        bytes32 ethSigned = ECDSA.toEthSignedMessageHash(abi.encodePacked(docHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, ethSigned);
        return abi.encodePacked(r, s, v);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 1: Almacenar y verificar documento correctamente
    // ─────────────────────────────────────────────────────────
    function testStoreAndVerify() public {
        bytes32 docHash = keccak256(abi.encodePacked("documento de prueba"));
        uint256 ts = block.timestamp;
        bytes memory sig = _sign(docHash, privateKey);

        registry.storeDocumentHash(docHash, ts, sig);

        assertTrue(registry.isDocumentStored(docHash));

        DocumentRegistry.Document memory doc = registry.getDocumentInfo(docHash);
        assertEq(doc.hash,      docHash);
        assertEq(doc.timestamp, ts);
        assertEq(doc.signer,    vm.addr(privateKey));
        assertEq(keccak256(doc.signature), keccak256(sig));
        assertTrue(registry.verifyDocument(docHash, doc.signer, sig));
    }

    // ─────────────────────────────────────────────────────────
    // TEST 2: Rechazar documento duplicado
    // ─────────────────────────────────────────────────────────
    function testCannotStoreTwice() public {
        bytes32 docHash = keccak256(abi.encodePacked("doc duplicado"));
        bytes memory sig = _sign(docHash, privateKey);

        registry.storeDocumentHash(docHash, block.timestamp, sig);

        vm.expectRevert(bytes("Document already exists"));
        registry.storeDocumentHash(docHash, block.timestamp, sig);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 3: Verificar con firmante incorrecto devuelve false
    // ─────────────────────────────────────────────────────────
    function testVerifyWrongSigner() public {
        bytes32 docHash = keccak256(abi.encodePacked("doc firmante incorrecto"));
        bytes memory sig = _sign(docHash, privateKey);

        registry.storeDocumentHash(docHash, block.timestamp, sig);

        address wrongAddr = address(0xdeadbeef);
        assertFalse(registry.verifyDocument(docHash, wrongAddr, sig));
    }

    // ─────────────────────────────────────────────────────────
    // TEST 4: Contador empieza en cero
    // ─────────────────────────────────────────────────────────
    function testDocumentCount_StartsAtZero() public view {
        assertEq(registry.getDocumentCount(), 0);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 5: Contador incrementa al almacenar
    // ─────────────────────────────────────────────────────────
    function testDocumentCount_AfterStore() public {
        bytes32 docHash = keccak256(abi.encodePacked("doc para contar"));
        registry.storeDocumentHash(docHash, block.timestamp, _sign(docHash, privateKey));

        assertEq(registry.getDocumentCount(), 1);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 6: Obtener hash por índice correctamente
    // ─────────────────────────────────────────────────────────
    function testGetDocumentHashByIndex() public {
        bytes32 docHash = keccak256(abi.encodePacked("doc por indice"));
        registry.storeDocumentHash(docHash, block.timestamp, _sign(docHash, privateKey));

        assertEq(registry.getDocumentHashByIndex(0), docHash);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 7: Índice fuera de rango revierte
    // ─────────────────────────────────────────────────────────
    function testGetDocumentHashByIndex_OutOfBounds() public {
        vm.expectRevert(bytes("Index out of bounds"));
        registry.getDocumentHashByIndex(0);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 8: getDocumentInfo revierte si no existe
    // ─────────────────────────────────────────────────────────
    function testGetDocumentInfo_Reverts_IfNotStored() public {
        bytes32 fakeHash = keccak256(abi.encodePacked("no existe"));
        vm.expectRevert(bytes("Document does not exist"));
        registry.getDocumentInfo(fakeHash);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 9: isDocumentStored devuelve false para doc inexistente
    // ─────────────────────────────────────────────────────────
    function testIsDocumentStored_ReturnsFalse() public view {
        bytes32 fakeHash = keccak256(abi.encodePacked("jamas almacenado"));
        assertFalse(registry.isDocumentStored(fakeHash));
    }

    // ─────────────────────────────────────────────────────────
    // TEST 10: verifyDocument devuelve false si el doc no existe
    // ─────────────────────────────────────────────────────────
    function testVerifyDocument_ReturnsFalse_IfNotStored() public {
        bytes32 fakeHash = keccak256(abi.encodePacked("doc fantasma"));
        bytes memory anySig = _sign(fakeHash, privateKey);

        assertFalse(registry.verifyDocument(fakeHash, vm.addr(privateKey), anySig));
    }

    // ─────────────────────────────────────────────────────────
    // TEST 11: Múltiples documentos con distintas wallets
    // ─────────────────────────────────────────────────────────
    function testStoreMultipleDocuments() public {
        bytes32 hash1 = keccak256(abi.encodePacked("doc uno"));
        bytes32 hash2 = keccak256(abi.encodePacked("doc dos"));
        bytes32 hash3 = keccak256(abi.encodePacked("doc tres"));

        registry.storeDocumentHash(hash1, block.timestamp,     _sign(hash1, privateKey));
        registry.storeDocumentHash(hash2, block.timestamp + 1, _sign(hash2, privateKey2));
        registry.storeDocumentHash(hash3, block.timestamp + 2, _sign(hash3, privateKey));

        assertEq(registry.getDocumentCount(), 3);
        assertEq(registry.getDocumentHashByIndex(0), hash1);
        assertEq(registry.getDocumentHashByIndex(1), hash2);
        assertEq(registry.getDocumentHashByIndex(2), hash3);

        // Verificar firmantes correctos
        DocumentRegistry.Document memory doc1 = registry.getDocumentInfo(hash1);
        DocumentRegistry.Document memory doc2 = registry.getDocumentInfo(hash2);
        assertEq(doc1.signer, vm.addr(privateKey));
        assertEq(doc2.signer, vm.addr(privateKey2));

        // Firma de key1 presentada como si fuera de key1 -> valido
        assertTrue(registry.verifyDocument(hash1, vm.addr(privateKey), _sign(hash1, privateKey)));
        // Firma de key2 presentada como si fuera de key1 -> invalido (recovered != signer param)
        assertFalse(registry.verifyDocument(hash1, vm.addr(privateKey), _sign(hash1, privateKey2)));
    }
}
