// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title  Paylink — shareable payment links with optional recipient/secret restrictions
/// @notice Allows a payer to lock native CELO or ERC20 tokens as a "paylink" that can be claimed by a recipient.
/// @dev Uses OpenZeppelin libraries for safety (SafeERC20 + ReentrancyGuard + Ownable).
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Decimals {
    function decimals() external view returns (uint8);
}

contract Paylink is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Address representing native CELO (similar to how WETH uses address(0))
    address public constant NATIVE_CELO = address(0);

    constructor() Ownable(msg.sender) {
    }

    struct Claim {
        address payer;
        address token; // address(0) for native CELO
        uint256 amount;
        uint256 expiry;
        bool claimed;
        address recipient;
        bytes32 secretHash;
    }

    mapping(uint256 => Claim) public claims;
    uint256 public nextClaimId = 1;
    bool public paused;

    event ClaimCreated(
        uint256 indexed id,
        address indexed payer,
        address indexed token,
        uint256 amount,
        uint256 expiry,
        address recipient,
        bytes32 secretHash
    );

    event Claimed(uint256 indexed id, address indexed claimer, uint256 amount);
    event Reclaimed(uint256 indexed id, address indexed payer, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    modifier notPaused() {
        require(!paused, "contract paused");
        _;
    }

    /// @notice Create a claim with native CELO
    /// @dev Send CELO value with the transaction
    function createClaimNative(
        uint256 expiry,
        address recipient,
        bytes32 secretHash
    ) external payable notPaused returns (uint256) {
        require(msg.value > 0, "amount>0");
        require(expiry > block.timestamp, "expiry in future");

        uint256 id = nextClaimId++;
        claims[id] = Claim({
            payer: msg.sender,
            token: NATIVE_CELO,
            amount: msg.value,
            expiry: expiry,
            claimed: false,
            recipient: recipient,
            secretHash: secretHash
        });

        emit ClaimCreated(id, msg.sender, NATIVE_CELO, msg.value, expiry, recipient, secretHash);
        return id;
    }

    /// @notice Create a claim with ERC20 tokens
    function createClaimERC20(
        address token,
        uint256 amount,
        uint256 expiry,
        address recipient,
        bytes32 secretHash
    ) external notPaused returns (uint256) {
        require(token != address(0), "token required");
        require(amount > 0, "amount>0");
        require(expiry > block.timestamp, "expiry in future");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 id = nextClaimId++;
        claims[id] = Claim({
            payer: msg.sender,
            token: token,
            amount: amount,
            expiry: expiry,
            claimed: false,
            recipient: recipient,
            secretHash: secretHash
        });

        emit ClaimCreated(id, msg.sender, token, amount, expiry, recipient, secretHash);
        return id;
    }

    /// @notice Claim tokens or native CELO
    function claim(uint256 id, bytes calldata secret) external nonReentrant notPaused {
        Claim storage c = claims[id];
        require(!c.claimed, "already claimed");
        require(c.amount > 0, "invalid claim");
        require(block.timestamp <= c.expiry, "claim expired");

        if (c.recipient != address(0)) {
            require(msg.sender == c.recipient, "not authorized recipient");
        }

        if (c.secretHash != bytes32(0)) {
            require(keccak256(secret) == c.secretHash, "invalid secret");
            c.secretHash = bytes32(0);
        }

        c.claimed = true;

        if (c.token == NATIVE_CELO) {
            // Transfer native CELO
            (bool success, ) = payable(msg.sender).call{value: c.amount}("");
            require(success, "CELO transfer failed");
        } else {
            // Transfer ERC20 token
            IERC20(c.token).safeTransfer(msg.sender, c.amount);
        }

        emit Claimed(id, msg.sender, c.amount);
    }

    /// @notice Reclaim expired tokens/CELO back to payer
    function reclaim(uint256 id) external nonReentrant {
        Claim storage c = claims[id];
        require(!c.claimed, "already claimed");
        require(c.amount > 0, "invalid claim");
        require(block.timestamp > c.expiry, "not expired");
        require(msg.sender == c.payer, "not payer");

        c.claimed = true;

        if (c.token == NATIVE_CELO) {
            // Transfer native CELO back to payer
            (bool success, ) = payable(c.payer).call{value: c.amount}("");
            require(success, "CELO transfer failed");
        } else {
            // Transfer ERC20 token back to payer
            IERC20(c.token).safeTransfer(c.payer, c.amount);
        }

        emit Reclaimed(id, c.payer, c.amount);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Emergency withdraw ERC20 tokens (owner only)
    function emergencyWithdrawERC20(address token, uint256 amount, address to) external onlyOwner {
        require(to != address(0), "invalid recipient");
        require(token != address(0), "use emergencyWithdrawNative for CELO");
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Emergency withdraw native CELO (owner only)
    function emergencyWithdrawNative(uint256 amount, address payable to) external onlyOwner {
        require(to != address(0), "invalid recipient");
        require(amount <= address(this).balance, "insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "CELO transfer failed");
    }

    /// @notice Get public claim information
    function getClaimPublic(uint256 id)
        external
        view
        returns (
            address payer,
            address token,
            uint256 amount,
            uint256 expiry,
            bool claimed,
            address recipientMasked,
            bool requiresSecret,
            bool isNative
        )
    {
        Claim storage c = claims[id];
        payer = c.payer;
        token = c.token;
        amount = c.amount;
        expiry = c.expiry;
        claimed = c.claimed;
        recipientMasked = c.recipient;
        requiresSecret = (c.secretHash != bytes32(0));
        isNative = (c.token == NATIVE_CELO);
    }

    /// @notice Check if a claim uses native CELO
    function isNativeClaim(uint256 id) external view returns (bool) {
        return claims[id].token == NATIVE_CELO;
    }

    /// @notice Get contract's native CELO balance
    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Allow contract to receive CELO
    receive() external payable {
        // Contract can receive CELO, but only through createClaimNative or direct sends
    }

    /// @notice Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}