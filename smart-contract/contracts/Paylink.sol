// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title  Paylink — shareable payment links with optional recipient/secret restrictions
/// @notice Allows a payer to lock ERC20 tokens as a "paylink" that can be claimed by a recipient.
/// @dev Uses OpenZeppelin libraries for safety (SafeERC20 + ReentrancyGuard + Ownable).
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Decimals {
    function decimals() external view returns (uint8);
}

contract Paylink is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Claim {
        address payer;
        address token;
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
        IERC20(c.token).safeTransfer(msg.sender, c.amount);

        emit Claimed(id, msg.sender, c.amount);
    }

    function reclaim(uint256 id) external nonReentrant {
        Claim storage c = claims[id];
        require(!c.claimed, "already claimed");
        require(c.amount > 0, "invalid claim");
        require(block.timestamp > c.expiry, "not expired");
        require(msg.sender == c.payer, "not payer");

        c.claimed = true;
        IERC20(c.token).safeTransfer(c.payer, c.amount);

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

    function emergencyWithdrawERC20(address token, uint256 amount, address to) external onlyOwner {
        require(to != address(0), "invalid recipient");
        IERC20(token).safeTransfer(to, amount);
    }

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
            bool requiresSecret
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
    }
}
