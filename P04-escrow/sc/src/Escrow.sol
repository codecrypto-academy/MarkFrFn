// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Escrow — intercambio atómico de tokens ERC20
/// @notice El owner autoriza tokens; usuarios crean/completan/cancelan operaciones de swap
contract Escrow is Ownable, ReentrancyGuard {

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Operation {
        uint256 id;
        address creator;
        address tokenA;   // token que deposita el creador
        address tokenB;   // token que solicita a cambio
        uint256 amountA;
        uint256 amountB;
        bool    isActive;
    }

    // ─── Errors ───────────────────────────────────────────────────────────────

    error TokenNotAllowed(address token);
    error TokenAlreadyAdded(address token);
    error OperationNotActive(uint256 id);
    error CannotCompleteOwnOperation();
    error OnlyCreatorCanCancel();

    // ─── Events ───────────────────────────────────────────────────────────────

    event TokenAdded(address indexed token);
    event OperationCreated(
        uint256 indexed id,
        address indexed creator,
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    );
    event OperationCompleted(uint256 indexed id, address indexed completer);
    event OperationCancelled(uint256 indexed id);

    // ─── State ────────────────────────────────────────────────────────────────

    mapping(address => bool) public allowedTokens;
    address[] private _tokenList;

    mapping(uint256 => Operation) private _operations;
    uint256 public operationCount;

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier tokenAllowed(address token) {
        if (!allowedTokens[token]) revert TokenNotAllowed(token);
        _;
    }

    modifier operationActive(uint256 id) {
        if (!_operations[id].isActive) revert OperationNotActive(id);
        _;
    }

    // ─── Owner functions ──────────────────────────────────────────────────────

    /// @notice Autoriza un token ERC20 para ser usado en operaciones
    function addToken(address token) external onlyOwner {
        if (allowedTokens[token]) revert TokenAlreadyAdded(token);
        allowedTokens[token] = true;
        _tokenList.push(token);
        emit TokenAdded(token);
    }

    // ─── User functions ───────────────────────────────────────────────────────

    /// @notice Crea una operación de swap: deposita tokenA y solicita tokenB
    /// @dev El caller debe haber llamado tokenA.approve(escrow, amountA) antes
    function createOperation(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    )
        external
        tokenAllowed(tokenA)
        tokenAllowed(tokenB)
    {
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);

        operationCount++;
        _operations[operationCount] = Operation({
            id:       operationCount,
            creator:  msg.sender,
            tokenA:   tokenA,
            tokenB:   tokenB,
            amountA:  amountA,
            amountB:  amountB,
            isActive: true
        });

        emit OperationCreated(operationCount, msg.sender, tokenA, tokenB, amountA, amountB);
    }

    /// @notice Completa el swap: aporta tokenB y recibe tokenA
    /// @dev El caller debe haber llamado tokenB.approve(escrow, amountB) antes
    function completeOperation(uint256 id)
        external
        nonReentrant
        operationActive(id)
    {
        Operation storage op = _operations[id];
        if (msg.sender == op.creator) revert CannotCompleteOwnOperation();

        // tokenB del completador → creador
        IERC20(op.tokenB).transferFrom(msg.sender, op.creator, op.amountB);
        // tokenA del contrato → completador
        IERC20(op.tokenA).transfer(msg.sender, op.amountA);

        op.isActive = false;
        emit OperationCompleted(id, msg.sender);
    }

    /// @notice Cancela la operación y devuelve tokenA al creador
    function cancelOperation(uint256 id)
        external
        nonReentrant
        operationActive(id)
    {
        Operation storage op = _operations[id];
        if (msg.sender != op.creator) revert OnlyCreatorCanCancel();

        IERC20(op.tokenA).transfer(op.creator, op.amountA);
        op.isActive = false;
        emit OperationCancelled(id);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    function getAllowedTokens() external view returns (address[] memory) {
        return _tokenList;
    }

    function getAllOperations() external view returns (Operation[] memory) {
        Operation[] memory list = new Operation[](operationCount);
        for (uint256 i = 1; i <= operationCount; i++) {
            list[i - 1] = _operations[i];
        }
        return list;
    }
}
