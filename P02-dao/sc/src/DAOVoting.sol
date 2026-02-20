// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DAOVoting
 * @notice DAO con sistema de propuestas y votación gasless via meta-transacciones (ERC-2771).
 *
 * Reglas de negocio:
 *  - Para votar: tener balance > 0 en el DAO
 *  - Para crear propuesta: tener >= 10% del balance total del DAO
 *  - Votación: FOR / AGAINST / ABSTAIN; se puede cambiar antes del deadline
 *  - Ejecución: deadline pasado + votesFor > votesAgainst + fondos suficientes
 *
 * ERC-2771: _msgSender() devuelve al usuario original aunque la tx la envíe el relayer.
 */
contract DAOVoting is ERC2771Context, ReentrancyGuard {

    // ─── Tipos ──────────────────────────────────────────────────────────────

    enum VoteType { FOR, AGAINST, ABSTAIN }

    struct Proposal {
        uint256 id;
        address recipient;
        uint256 amount;
        uint256 deadline;
        string  description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool    executed;
    }

    // ─── Estado ─────────────────────────────────────────────────────────────

    uint256 public proposalCount;
    uint256 public totalBalance;
    uint256 public constant MIN_BALANCE_BPS = 10; // 10 de cada 100

    mapping(uint256 => Proposal)                          private _proposals;
    mapping(address => uint256)                           public  userBalance;
    mapping(uint256 => mapping(address => bool))          public  hasVoted;
    mapping(uint256 => mapping(address => VoteType))      public  userVote;

    // ─── Eventos ────────────────────────────────────────────────────────────

    event FundsDeposited(address indexed user, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, address indexed creator, address recipient, uint256 amount, uint256 deadline);
    event Voted(uint256 indexed proposalId, address indexed voter, VoteType voteType);
    event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);

    // ─── Modifiers ──────────────────────────────────────────────────────────

    modifier proposalExists(uint256 proposalId) {
        require(_proposals[proposalId].id != 0, "DAOVoting: proposal does not exist");
        _;
    }

    modifier notExecuted(uint256 proposalId) {
        require(!_proposals[proposalId].executed, "DAOVoting: proposal already executed");
        _;
    }

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    // ─── Fondos ─────────────────────────────────────────────────────────────

    /**
     * @notice Deposita ETH en el DAO. El balance queda asociado al sender.
     *         Tener balance es el requisito para votar.
     */
    function fundDAO() external payable {
        require(msg.value > 0, "DAOVoting: must send ETH");
        userBalance[_msgSender()] += msg.value;
        totalBalance += msg.value;
        emit FundsDeposited(_msgSender(), msg.value);
    }

    // ─── Propuestas ─────────────────────────────────────────────────────────

    /**
     * @notice Crea una propuesta para transferir `amount` ETH a `recipient`.
     *         Requiere que el sender tenga >= 10% del balance total del DAO.
     */
    function createProposal(
        address recipient,
        uint256 amount,
        uint256 deadline,
        string calldata description
    ) external returns (uint256) {
        address sender = _msgSender();

        require(totalBalance > 0, "DAOVoting: DAO has no funds");
        require(recipient != address(0), "DAOVoting: invalid recipient");
        require(amount > 0 && amount <= totalBalance, "DAOVoting: invalid amount");
        require(deadline > block.timestamp, "DAOVoting: deadline must be in the future");
        require(
            userBalance[sender] * 100 >= totalBalance * MIN_BALANCE_BPS,
            "DAOVoting: insufficient balance to create proposal"
        );

        proposalCount++;
        _proposals[proposalCount] = Proposal({
            id:           proposalCount,
            recipient:    recipient,
            amount:       amount,
            deadline:     deadline,
            description:  description,
            votesFor:     0,
            votesAgainst: 0,
            votesAbstain: 0,
            executed:     false
        });

        emit ProposalCreated(proposalCount, sender, recipient, amount, deadline);
        return proposalCount;
    }

    // ─── Votación ───────────────────────────────────────────────────────────

    /**
     * @notice Emite o cambia el voto del sender en una propuesta activa.
     *         Se puede cambiar el voto cuantas veces se quiera antes del deadline.
     */
    function vote(uint256 proposalId, VoteType voteType)
        external
        proposalExists(proposalId)
        notExecuted(proposalId)
    {
        address voter = _msgSender();
        Proposal storage proposal = _proposals[proposalId];

        require(block.timestamp < proposal.deadline, "DAOVoting: voting period ended");
        require(userBalance[voter] > 0, "DAOVoting: no balance to vote");

        // Si ya votó, restar el voto anterior
        if (hasVoted[proposalId][voter]) {
            VoteType prev = userVote[proposalId][voter];
            if (prev == VoteType.FOR)     proposal.votesFor--;
            else if (prev == VoteType.AGAINST) proposal.votesAgainst--;
            else                          proposal.votesAbstain--;
        }

        hasVoted[proposalId][voter]  = true;
        userVote[proposalId][voter]  = voteType;

        if (voteType == VoteType.FOR)         proposal.votesFor++;
        else if (voteType == VoteType.AGAINST) proposal.votesAgainst++;
        else                                   proposal.votesAbstain++;

        emit Voted(proposalId, voter, voteType);
    }

    // ─── Ejecución ──────────────────────────────────────────────────────────

    /**
     * @notice Ejecuta una propuesta aprobada.
     *         Condiciones: deadline pasado + votos a favor > votos en contra + fondos suficientes.
     *         nonReentrant protege contra ataques de reentrada en la transferencia de ETH.
     */
    function executeProposal(uint256 proposalId)
        external
        nonReentrant
        proposalExists(proposalId)
        notExecuted(proposalId)
    {
        Proposal storage proposal = _proposals[proposalId];

        require(block.timestamp >= proposal.deadline, "DAOVoting: voting period not ended");
        require(proposal.votesFor > proposal.votesAgainst, "DAOVoting: proposal not approved");
        require(address(this).balance >= proposal.amount, "DAOVoting: insufficient funds");

        proposal.executed = true;
        totalBalance -= proposal.amount;

        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "DAOVoting: transfer failed");

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    // ─── Consultas ──────────────────────────────────────────────────────────

    function getProposal(uint256 proposalId)
        external view
        proposalExists(proposalId)
        returns (Proposal memory)
    {
        return _proposals[proposalId];
    }

    function getUserBalance(address user) external view returns (uint256) {
        return userBalance[user];
    }

    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }

    // ─── Recepción directa de ETH ────────────────────────────────────────────

    receive() external payable {
        userBalance[_msgSender()] += msg.value;
        totalBalance += msg.value;
        emit FundsDeposited(_msgSender(), msg.value);
    }
}
