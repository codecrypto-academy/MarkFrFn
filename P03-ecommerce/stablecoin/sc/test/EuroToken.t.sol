// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken internal token;

    address internal owner = address(this);
    address internal alice = makeAddr("alice");
    address internal bob   = makeAddr("bob");

    uint256 constant ONE_EURT = 1_000_000; // 1 EURT con 6 decimales

    function setUp() public {
        token = new EuroToken();
    }

    // ─── DEPLOY ───────────────────────────────────────────────────────────────

    function testDeploy_Name() public view {
        assertEq(token.name(), "EuroToken");
    }

    function testDeploy_Symbol() public view {
        assertEq(token.symbol(), "EURT");
    }

    function testDeploy_Decimals() public view {
        assertEq(token.decimals(), 6);
    }

    function testDeploy_Owner() public view {
        assertEq(token.owner(), owner);
    }

    function testDeploy_InitialSupplyZero() public view {
        assertEq(token.totalSupply(), 0);
    }

    // ─── MINT ─────────────────────────────────────────────────────────────────

    function testMint_ByOwner_UpdatesBalance() public {
        token.mint(alice, 100 * ONE_EURT);
        assertEq(token.balanceOf(alice), 100 * ONE_EURT);
    }

    function testMint_ByOwner_UpdatesTotalSupply() public {
        token.mint(alice, 100 * ONE_EURT);
        token.mint(bob, 50 * ONE_EURT);
        assertEq(token.totalSupply(), 150 * ONE_EURT);
    }

    function testMint_EmitsMintedEvent() public {
        vm.expectEmit(true, false, false, true);
        emit EuroToken.Minted(alice, 100 * ONE_EURT);
        token.mint(alice, 100 * ONE_EURT);
    }

    function testMint_ByNonOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(EuroToken.NotOwner.selector);
        token.mint(bob, 100 * ONE_EURT);
    }

    function testMint_ToZeroAddress_Reverts() public {
        vm.expectRevert(EuroToken.ZeroAddress.selector);
        token.mint(address(0), 100 * ONE_EURT);
    }

    function testMint_ZeroAmount_Reverts() public {
        vm.expectRevert(EuroToken.ZeroAmount.selector);
        token.mint(alice, 0);
    }

    // ─── TRANSFER ─────────────────────────────────────────────────────────────

    function testTransfer_BetweenAccounts() public {
        token.mint(alice, 100 * ONE_EURT);
        vm.prank(alice);
        token.transfer(bob, 30 * ONE_EURT);
        assertEq(token.balanceOf(alice), 70 * ONE_EURT);
        assertEq(token.balanceOf(bob), 30 * ONE_EURT);
    }

    function testTransferFrom_WithApproval() public {
        token.mint(alice, 100 * ONE_EURT);
        vm.prank(alice);
        token.approve(bob, 50 * ONE_EURT);
        vm.prank(bob);
        token.transferFrom(alice, bob, 50 * ONE_EURT);
        assertEq(token.balanceOf(alice), 50 * ONE_EURT);
        assertEq(token.balanceOf(bob), 50 * ONE_EURT);
    }

    function testTransfer_InsufficientBalance_Reverts() public {
        token.mint(alice, 10 * ONE_EURT);
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 20 * ONE_EURT);
    }

    // ─── OWNERSHIP ────────────────────────────────────────────────────────────

    function testTransferOwnership() public {
        token.transferOwnership(alice);
        assertEq(token.owner(), alice);
    }

    function testTransferOwnership_ByNonOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(EuroToken.NotOwner.selector);
        token.transferOwnership(bob);
    }

    function testTransferOwnership_ToZeroAddress_Reverts() public {
        vm.expectRevert(EuroToken.ZeroAddress.selector);
        token.transferOwnership(address(0));
    }

    function testNewOwner_CanMint() public {
        token.transferOwnership(alice);
        vm.prank(alice);
        token.mint(bob, 100 * ONE_EURT);
        assertEq(token.balanceOf(bob), 100 * ONE_EURT);
    }

    function testOldOwner_CannotMintAfterTransfer() public {
        token.transferOwnership(alice);
        vm.expectRevert(EuroToken.NotOwner.selector);
        token.mint(bob, 100 * ONE_EURT);
    }
}
