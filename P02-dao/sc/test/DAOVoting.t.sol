// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

/**
 * @title DAOVotingTest
 * @notice Suite completa de tests para MinimalForwarder + DAOVoting.
 *
 * Estructura:
 *  - Helpers de firma EIP-712 para meta-transacciones
 *  - Tests de fondos
 *  - Tests de propuestas (normal + gasless)
 *  - Tests de votación (normal + gasless + cambio de voto)
 *  - Tests de ejecución
 *  - Tests de edge cases
 */
contract DAOVotingTest is Test {

    // ─── Contratos ──────────────────────────────────────────────────────────

    MinimalForwarder internal forwarder;
    DAOVoting        internal dao;

    // ─── Wallets de prueba ──────────────────────────────────────────────────

    // userA tiene >10% del balance → puede crear propuestas
    uint256 internal userAKey  = 0xA11CE;
    address internal userA     = vm.addr(userAKey);

    // userB tiene <10% del balance → solo puede votar
    uint256 internal userBKey  = 0xB0B;
    address internal userB     = vm.addr(userBKey);

    // relayer: paga gas; su dirección es el msg.sender real en meta-tx
    uint256 internal relayerKey = 0xBEEF;
    address internal relayer    = vm.addr(relayerKey);

    address internal recipient  = makeAddr("recipient");

    // ─── Setup ──────────────────────────────────────────────────────────────

    function setUp() public {
        forwarder = new MinimalForwarder();
        dao       = new DAOVoting(address(forwarder));

        // ETH inicial para el relayer
        vm.deal(relayer, 10 ether);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FONDOS
    // ═══════════════════════════════════════════════════════════════════════

    function testFundDAO_UpdatesBalances() public {
        vm.deal(userA, 10 ether);
        vm.prank(userA);
        dao.fundDAO{value: 10 ether}();

        assertEq(dao.userBalance(userA), 10 ether);
        assertEq(dao.totalBalance(), 10 ether);
        assertEq(address(dao).balance, 10 ether);
    }

    function testFundDAO_MultipleUsers() public {
        vm.deal(userA, 10 ether);
        vm.deal(userB, 5 ether);

        vm.prank(userA); dao.fundDAO{value: 10 ether}();
        vm.prank(userB); dao.fundDAO{value: 5 ether}();

        assertEq(dao.totalBalance(), 15 ether);
        assertEq(dao.userBalance(userA), 10 ether);
        assertEq(dao.userBalance(userB), 5 ether);
    }

    function testFundDAO_RejectsZeroValue() public {
        vm.expectRevert("DAOVoting: must send ETH");
        dao.fundDAO{value: 0}();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CREACIÓN DE PROPUESTAS
    // ═══════════════════════════════════════════════════════════════════════

    function testCreateProposal_HappyPath() public {
        _fundUsers(10 ether, 5 ether);

        vm.prank(userA);
        uint256 id = dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");

        assertEq(id, 1);
        assertEq(dao.proposalCount(), 1);

        DAOVoting.Proposal memory p = dao.getProposal(1);
        assertEq(p.recipient, recipient);
        assertEq(p.amount, 1 ether);
        assertFalse(p.executed);
    }

    function testCreateProposal_InsufficientBalance_Reverts() public {
        _fundUsers(10 ether, 1 ether); // userB tiene 1/11 ≈ 9% < 10%

        vm.expectRevert("DAOVoting: insufficient balance to create proposal");
        vm.prank(userB);
        dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");
    }

    function testCreateProposal_NoFunds_Reverts() public {
        vm.expectRevert("DAOVoting: DAO has no funds");
        vm.prank(userA);
        dao.createProposal(recipient, 1 ether, block.timestamp + 1 days, "Test");
    }

    function testCreateProposal_InvalidRecipient_Reverts() public {
        _fundUsers(10 ether, 0);

        vm.expectRevert("DAOVoting: invalid recipient");
        vm.prank(userA);
        dao.createProposal(address(0), 1 ether, block.timestamp + 1 days, "Test");
    }

    function testCreateProposal_PastDeadline_Reverts() public {
        _fundUsers(10 ether, 0);

        vm.expectRevert("DAOVoting: deadline must be in the future");
        vm.prank(userA);
        dao.createProposal(recipient, 1 ether, block.timestamp, "Test");
    }

    // ─── Creación gasless (meta-transacción) ─────────────────────────────

    function testCreateProposal_Gasless() public {
        _fundUsers(10 ether, 5 ether);

        // userA construye y firma la meta-tx off-chain
        bytes memory data = abi.encodeWithSelector(
            DAOVoting.createProposal.selector,
            recipient,
            1 ether,
            block.timestamp + 1 days,
            "Gasless proposal"
        );

        (MinimalForwarder.ForwardRequest memory req, bytes memory sig) =
            _buildAndSign(userAKey, address(dao), data, 0);

        // El relayer ejecuta (paga gas, no userA)
        vm.prank(relayer);
        forwarder.execute{gas: 1_000_000}(req, sig);

        // La propuesta fue creada con userA como creator
        assertEq(dao.proposalCount(), 1);
        DAOVoting.Proposal memory p = dao.getProposal(1);
        assertEq(p.recipient, recipient);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOTACIÓN
    // ═══════════════════════════════════════════════════════════════════════

    function testVote_For() public {
        uint256 id = _setupProposal();

        vm.prank(userA);
        dao.vote(id, DAOVoting.VoteType.FOR);

        DAOVoting.Proposal memory p = dao.getProposal(id);
        assertEq(p.votesFor, 1);
        assertEq(p.votesAgainst, 0);
        assertTrue(dao.hasVoted(id, userA));
    }

    function testVote_Against() public {
        uint256 id = _setupProposal();

        vm.prank(userA);
        dao.vote(id, DAOVoting.VoteType.AGAINST);

        assertEq(dao.getProposal(id).votesAgainst, 1);
    }

    function testVote_Abstain() public {
        uint256 id = _setupProposal();

        vm.prank(userA);
        dao.vote(id, DAOVoting.VoteType.ABSTAIN);

        assertEq(dao.getProposal(id).votesAbstain, 1);
    }

    function testVote_ChangeVote() public {
        uint256 id = _setupProposal();

        vm.prank(userA);
        dao.vote(id, DAOVoting.VoteType.FOR);
        assertEq(dao.getProposal(id).votesFor, 1);

        // Cambia a AGAINST
        vm.prank(userA);
        dao.vote(id, DAOVoting.VoteType.AGAINST);

        DAOVoting.Proposal memory p = dao.getProposal(id);
        assertEq(p.votesFor, 0);
        assertEq(p.votesAgainst, 1);
    }

    function testVote_AfterDeadline_Reverts() public {
        uint256 id = _setupProposal();

        vm.warp(block.timestamp + 2 days);

        vm.expectRevert("DAOVoting: voting period ended");
        vm.prank(userA);
        dao.vote(id, DAOVoting.VoteType.FOR);
    }

    function testVote_NoBalance_Reverts() public {
        uint256 id = _setupProposal();
        address noBalance = makeAddr("noBalance");

        vm.expectRevert("DAOVoting: no balance to vote");
        vm.prank(noBalance);
        dao.vote(id, DAOVoting.VoteType.FOR);
    }

    function testVote_ProposalNotExist_Reverts() public {
        vm.expectRevert("DAOVoting: proposal does not exist");
        vm.prank(userA);
        dao.vote(99, DAOVoting.VoteType.FOR);
    }

    // ─── Votación gasless ────────────────────────────────────────────────

    function testVote_Gasless() public {
        uint256 id = _setupProposal();

        bytes memory data = abi.encodeWithSelector(
            DAOVoting.vote.selector,
            id,
            DAOVoting.VoteType.FOR
        );

        (MinimalForwarder.ForwardRequest memory req, bytes memory sig) =
            _buildAndSign(userAKey, address(dao), data, 0);

        vm.prank(relayer);
        forwarder.execute{gas: 1_000_000}(req, sig);

        // El voto fue registrado a nombre de userA, no del relayer
        assertEq(dao.getProposal(id).votesFor, 1);
        assertTrue(dao.hasVoted(id, userA));
        assertFalse(dao.hasVoted(id, relayer));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EJECUCIÓN DE PROPUESTAS
    // ═══════════════════════════════════════════════════════════════════════

    function testExecuteProposal_Approved() public {
        uint256 id = _setupProposal();

        // userA vota FOR, userB vota FOR → aprobada
        vm.prank(userA); dao.vote(id, DAOVoting.VoteType.FOR);
        vm.prank(userB); dao.vote(id, DAOVoting.VoteType.FOR);

        uint256 recipientBefore = recipient.balance;

        vm.warp(block.timestamp + 2 days);
        dao.executeProposal(id);

        assertEq(recipient.balance, recipientBefore + 1 ether);
        assertTrue(dao.getProposal(id).executed);
        assertEq(dao.totalBalance(), 14 ether); // 15 - 1
    }

    function testExecuteProposal_NotApproved_Reverts() public {
        uint256 id = _setupProposal();

        // Más votos en contra
        vm.prank(userA); dao.vote(id, DAOVoting.VoteType.AGAINST);
        vm.prank(userB); dao.vote(id, DAOVoting.VoteType.AGAINST);

        vm.warp(block.timestamp + 2 days);

        vm.expectRevert("DAOVoting: proposal not approved");
        dao.executeProposal(id);
    }

    function testExecuteProposal_BeforeDeadline_Reverts() public {
        uint256 id = _setupProposal();

        vm.prank(userA); dao.vote(id, DAOVoting.VoteType.FOR);

        vm.expectRevert("DAOVoting: voting period not ended");
        dao.executeProposal(id);
    }

    function testExecuteProposal_AlreadyExecuted_Reverts() public {
        uint256 id = _setupProposal();

        vm.prank(userA); dao.vote(id, DAOVoting.VoteType.FOR);
        vm.warp(block.timestamp + 2 days);
        dao.executeProposal(id);

        vm.expectRevert("DAOVoting: proposal already executed");
        dao.executeProposal(id);
    }

    function testExecuteProposal_NonExistent_Reverts() public {
        vm.expectRevert("DAOVoting: proposal does not exist");
        dao.executeProposal(99);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FORWARDER — NONCES Y FIRMAS
    // ═══════════════════════════════════════════════════════════════════════

    function testForwarder_NonceStartsAtZero() public view {
        assertEq(forwarder.getNonce(userA), 0);
    }

    function testForwarder_NonceIncrements() public {
        _fundUsers(10 ether, 5 ether);

        bytes memory data = abi.encodeWithSelector(
            DAOVoting.vote.selector,
            _setupProposal(),
            DAOVoting.VoteType.FOR
        );

        (MinimalForwarder.ForwardRequest memory req, bytes memory sig) =
            _buildAndSign(userAKey, address(dao), data, 0);

        vm.prank(relayer);
        forwarder.execute{gas: 1_000_000}(req, sig);

        assertEq(forwarder.getNonce(userA), 1);
    }

    function testForwarder_InvalidSignature_Reverts() public {
        bytes memory data = abi.encodeWithSelector(
            DAOVoting.vote.selector,
            1,
            DAOVoting.VoteType.FOR
        );

        (MinimalForwarder.ForwardRequest memory req,) =
            _buildAndSign(userAKey, address(dao), data, 0);

        // Firma con una clave incorrecta
        (, bytes memory wrongSig) = _buildAndSign(userBKey, address(dao), data, 0);

        vm.expectRevert("MinimalForwarder: invalid signature");
        vm.prank(relayer);
        forwarder.execute{gas: 1_000_000}(req, wrongSig);
    }

    function testForwarder_Verify_ValidSignature() public {
        bytes memory data = abi.encodeWithSelector(
            DAOVoting.getProposalCount.selector
        );

        (MinimalForwarder.ForwardRequest memory req, bytes memory sig) =
            _buildAndSign(userAKey, address(dao), data, 0);

        assertTrue(forwarder.verify(req, sig));
    }

    function testForwarder_Verify_WrongNonce_ReturnsFalse() public {
        bytes memory data = abi.encodeWithSelector(
            DAOVoting.getProposalCount.selector
        );

        // Construye con nonce=5 pero el nonce real del usuario es 0
        MinimalForwarder.ForwardRequest memory req = MinimalForwarder.ForwardRequest({
            from:  userA,
            to:    address(dao),
            value: 0,
            gas:   500_000,
            nonce: 5,
            data:  data
        });

        // Calcula el digest EIP-712 manualmente (igual que en _buildAndSign)
        bytes32 TYPEHASH = keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
        );
        bytes32 structHash = keccak256(abi.encode(
            TYPEHASH,
            req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)
        ));
        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("MinimalForwarder"),
            keccak256("1"),
            block.chainid,
            address(forwarder)
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userAKey, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        // La firma es válida pero el nonce no coincide → verify = false
        assertFalse(forwarder.verify(req, sig));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS INTERNOS
    // ═══════════════════════════════════════════════════════════════════════

    /// Fondea userA y opcionalmente userB con las cantidades dadas
    function _fundUsers(uint256 amountA, uint256 amountB) internal {
        if (amountA > 0) {
            vm.deal(userA, amountA);
            vm.prank(userA);
            dao.fundDAO{value: amountA}();
        }
        if (amountB > 0) {
            vm.deal(userB, amountB);
            vm.prank(userB);
            dao.fundDAO{value: amountB}();
        }
    }

    /// Fondea usuarios, crea una propuesta y devuelve su ID
    function _setupProposal() internal returns (uint256) {
        _fundUsers(10 ether, 5 ether);

        vm.prank(userA);
        return dao.createProposal(
            recipient,
            1 ether,
            block.timestamp + 1 days,
            "Test proposal"
        );
    }

    /// Construye una ForwardRequest firmada con EIP-712
    function _buildAndSign(
        uint256 signerKey,
        address to,
        bytes memory data,
        uint256 value
    ) internal view returns (MinimalForwarder.ForwardRequest memory req, bytes memory sig) {
        address signer = vm.addr(signerKey);

        req = MinimalForwarder.ForwardRequest({
            from:  signer,
            to:    to,
            value: value,
            gas:   500_000,
            nonce: forwarder.getNonce(signer),
            data:  data
        });

        bytes32 TYPEHASH = keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
        );

        bytes32 structHash = keccak256(abi.encode(
            TYPEHASH,
            req.from,
            req.to,
            req.value,
            req.gas,
            req.nonce,
            keccak256(req.data)
        ));

        // Reconstruye el domainSeparator usando los mismos parámetros que el contrato
        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("MinimalForwarder"),
            keccak256("1"),
            block.chainid,
            address(forwarder)
        ));

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        sig = abi.encodePacked(r, s, v);
    }
}
