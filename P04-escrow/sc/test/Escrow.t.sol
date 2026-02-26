// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/TestToken.sol";

contract EscrowTest is Test {

    Escrow    escrow;
    TestToken tokenA;
    TestToken tokenB;

    address owner   = address(0x1);
    address user1   = address(0x2);   // creador de operaciones
    address user2   = address(0x3);   // completador
    address user3   = address(0x4);   // tercero sin relación

    uint256 constant MINT_AMOUNT = 1_000 ether;
    uint256 constant AMOUNT_A    = 100 ether;
    uint256 constant AMOUNT_B    = 50 ether;

    function setUp() public {
        vm.startPrank(owner);
        escrow = new Escrow();
        tokenA = new TestToken("TokenA", "TKA");
        tokenB = new TestToken("TokenB", "TKB");
        vm.stopPrank();

        // Mint inicial para user1 y user2
        tokenA.mint(user1, MINT_AMOUNT);
        tokenB.mint(user2, MINT_AMOUNT);
    }

    // ─── addToken ─────────────────────────────────────────────────────────────

    function testAddToken_ByOwner() public {
        vm.prank(owner);
        escrow.addToken(address(tokenA));
        assertTrue(escrow.allowedTokens(address(tokenA)));
        assertEq(escrow.getAllowedTokens()[0], address(tokenA));
    }

    function testAddToken_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        escrow.addToken(address(tokenA));
    }

    function testAddToken_Duplicate() public {
        vm.startPrank(owner);
        escrow.addToken(address(tokenA));
        vm.expectRevert(abi.encodeWithSelector(Escrow.TokenAlreadyAdded.selector, address(tokenA)));
        escrow.addToken(address(tokenA));
        vm.stopPrank();
    }

    // ─── createOperation ──────────────────────────────────────────────────────

    function testCreateOperation_HappyPath() public {
        _addBothTokens();

        vm.startPrank(user1);
        tokenA.approve(address(escrow), AMOUNT_A);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        vm.stopPrank();

        assertEq(escrow.operationCount(), 1);
        // tokenA transferido al contrato
        assertEq(tokenA.balanceOf(address(escrow)), AMOUNT_A);
        assertEq(tokenA.balanceOf(user1), MINT_AMOUNT - AMOUNT_A);
    }

    function testCreateOperation_TokenNotAllowed() public {
        vm.startPrank(user1);
        tokenA.approve(address(escrow), AMOUNT_A);
        vm.expectRevert(abi.encodeWithSelector(Escrow.TokenNotAllowed.selector, address(tokenA)));
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        vm.stopPrank();
    }

    function testCreateOperation_InsufficientAllowance() public {
        _addBothTokens();
        // sin approve → transferFrom reverts
        vm.prank(user1);
        vm.expectRevert();
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
    }

    // ─── completeOperation ────────────────────────────────────────────────────

    function testCompleteOperation_HappyPath() public {
        _addBothTokens();
        _createOperation(); // user1 crea: ofrece 100 TKA, pide 50 TKB

        vm.startPrank(user2);
        tokenB.approve(address(escrow), AMOUNT_B);
        escrow.completeOperation(1);
        vm.stopPrank();

        // user2 recibió tokenA, user1 recibió tokenB
        assertEq(tokenA.balanceOf(user2), AMOUNT_A);
        assertEq(tokenB.balanceOf(user1), AMOUNT_B);
        // contrato vacío
        assertEq(tokenA.balanceOf(address(escrow)), 0);
    }

    function testCompleteOperation_OwnOperation() public {
        _addBothTokens();
        _createOperation();

        tokenB.mint(user1, AMOUNT_B);
        vm.startPrank(user1);
        tokenB.approve(address(escrow), AMOUNT_B);
        vm.expectRevert(Escrow.CannotCompleteOwnOperation.selector);
        escrow.completeOperation(1);
        vm.stopPrank();
    }

    function testCompleteOperation_InactiveOperation() public {
        _addBothTokens();
        _createOperation();

        // user1 cancela
        vm.prank(user1);
        escrow.cancelOperation(1);

        // user2 intenta completar una ya inactiva
        vm.startPrank(user2);
        tokenB.approve(address(escrow), AMOUNT_B);
        vm.expectRevert(abi.encodeWithSelector(Escrow.OperationNotActive.selector, 1));
        escrow.completeOperation(1);
        vm.stopPrank();
    }

    // ─── cancelOperation ──────────────────────────────────────────────────────

    function testCancelOperation_ByCreator() public {
        _addBothTokens();
        _createOperation();

        uint256 balanceBefore = tokenA.balanceOf(user1);

        vm.prank(user1);
        escrow.cancelOperation(1);

        // tokenA devuelto al creador
        assertEq(tokenA.balanceOf(user1), balanceBefore + AMOUNT_A);
        assertEq(tokenA.balanceOf(address(escrow)), 0);
    }

    function testCancelOperation_NotCreator() public {
        _addBothTokens();
        _createOperation();

        vm.prank(user2);
        vm.expectRevert(Escrow.OnlyCreatorCanCancel.selector);
        escrow.cancelOperation(1);
    }

    // ─── getAllOperations ─────────────────────────────────────────────────────

    function testGetAllOperations_Multiple() public {
        _addBothTokens();

        // user1 crea 2 operaciones
        tokenA.mint(user1, MINT_AMOUNT);
        vm.startPrank(user1);
        tokenA.approve(address(escrow), AMOUNT_A * 2);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        vm.stopPrank();

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(ops.length, 2);
        assertEq(ops[0].id, 1);
        assertEq(ops[1].id, 2);
        assertTrue(ops[0].isActive);
        assertTrue(ops[1].isActive);
    }

    function testGetAllOperations_EmptyArray() public view {
        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertEq(ops.length, 0);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function _addBothTokens() internal {
        vm.startPrank(owner);
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));
        vm.stopPrank();
    }

    function _createOperation() internal {
        vm.startPrank(user1);
        tokenA.approve(address(escrow), AMOUNT_A);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        vm.stopPrank();
    }
}
