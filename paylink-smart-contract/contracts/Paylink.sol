// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Decimals {
    function decimals() external view returns (uint8);
}

contract Paylink is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    address public constant NATIVE_CELO = address(0);

    constructor() Ownable(msg.sender) {}

    struct Claim {
        uint256 id;
        address payer;
        address token;
        uint256 amount;
        uint256 expiry;
        bool claimed;
        ClaimStatus status;
        address recipient;
        bytes32 secretHash;
    }

    enum ClaimStatus {
        CREATED,
        CLAIMED,
        RECLAIMED
    }

    uint256 public nextClaimId = 1;

    mapping(string => Claim) public claims;
    mapping(address => string[]) private userClaims;
    bool public paused;

    event ClaimCreated(
        string indexed code,
        address indexed payer,
        address indexed token,
        uint256 amount,
        uint256 expiry,
        address recipient,
        bytes32 secretHash
    );

    event Claimed(string indexed code, address indexed claimer, uint256 amount);
    event Reclaimed(string indexed code, address indexed payer, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    modifier notPaused() {
        require(!paused, "contract paused");
        _;
    }

    modifier validCode(string calldata code) {
        require(bytes(code).length == 32, "code must be 32 chars"); // UUID without dashes
        require(claims[code].payer == address(0), "code already exists");
        _;
    }

    function createClaimNative(
        uint256 expiry,
        address recipient,
        bytes32 secretHash,
        string calldata code
    ) external payable notPaused validCode(code) {
        require(msg.value > 0, "amount>0");
        require(expiry > block.timestamp, "expiry in future");

        claims[code] = Claim({
            id: nextClaimId,
            payer: msg.sender,
            token: NATIVE_CELO,
            amount: msg.value,
            expiry: expiry,
            claimed: false,
            status: ClaimStatus.CREATED,
            recipient: recipient,
            secretHash: secretHash
        });

        nextClaimId++;
        userClaims[msg.sender].push(code);

        emit ClaimCreated(
            code,
            msg.sender,
            NATIVE_CELO,
            msg.value,
            expiry,
            recipient,
            secretHash
        );
    }

    function createClaimERC20(
        address token,
        uint256 amount,
        uint256 expiry,
        address recipient,
        bytes32 secretHash,
        string calldata code
    ) external notPaused validCode(code) {
        require(token != address(0), "token required");
        require(amount > 0, "amount>0");
        require(expiry > block.timestamp, "expiry in future");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        claims[code] = Claim({
            id: nextClaimId,
            payer: msg.sender,
            token: token,
            amount: amount,
            expiry: expiry,
            claimed: false,
            status: ClaimStatus.CREATED,
            recipient: recipient,
            secretHash: secretHash
        });

        nextClaimId++;
        userClaims[msg.sender].push(code);

        emit ClaimCreated(
            code,
            msg.sender,
            token,
            amount,
            expiry,
            recipient,
            secretHash
        );
    }

    function claim(
        string calldata code,
        bytes calldata secret
    ) external nonReentrant notPaused {
        Claim storage c = claims[code];
        require(c.payer != address(0), "invalid claim");
        require(!c.claimed, "already claimed");
        require(block.timestamp <= c.expiry, "claim expired");

        if (c.recipient != address(0)) {
            require(msg.sender == c.recipient, "not authorized recipient");
        }

        if (c.secretHash != bytes32(0)) {
            require(keccak256(secret) == c.secretHash, "invalid secret");
            c.secretHash = bytes32(0);
        }

        c.claimed = true;
        c.status = ClaimStatus.CLAIMED;

        if (c.token == NATIVE_CELO) {
            (bool success, ) = payable(msg.sender).call{value: c.amount}("");
            require(success, "CELO transfer failed");
        } else {
            IERC20(c.token).safeTransfer(msg.sender, c.amount);
        }

        emit Claimed(code, msg.sender, c.amount);
    }

    function reclaim(string calldata code) external nonReentrant {
        Claim storage c = claims[code];
        require(c.payer != address(0), "invalid claim");
        require(!c.claimed, "already claimed");
        require(block.timestamp > c.expiry, "not expired");
        require(msg.sender == c.payer, "not payer");

        c.claimed = true;
        c.status = ClaimStatus.RECLAIMED;

        if (c.token == NATIVE_CELO) {
            (bool success, ) = payable(c.payer).call{value: c.amount}("");
            require(success, "CELO transfer failed");
        } else {
            IERC20(c.token).safeTransfer(c.payer, c.amount);
        }

        emit Reclaimed(code, c.payer, c.amount);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function emergencyWithdrawERC20(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        require(to != address(0), "invalid recipient");
        require(token != address(0), "use emergencyWithdrawNative for CELO");
        IERC20(token).safeTransfer(to, amount);
    }

    function emergencyWithdrawNative(
        uint256 amount,
        address payable to
    ) external onlyOwner {
        require(to != address(0), "invalid recipient");
        require(amount <= address(this).balance, "insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "CELO transfer failed");
    }

    function getClaimByCode(
        string calldata code
    )
        external
        view
        returns (
            uint256 id,
            address payer,
            address token,
            uint256 amount,
            uint256 expiry,
            bool claimed,
            ClaimStatus status,
            address recipient,
            bool requiresSecret,
            bool isNative
        )
    {
        Claim storage c = claims[code];
        require(c.payer != address(0), "invalid code");

        id = c.id;
        payer = c.payer;
        token = c.token;
        amount = c.amount;
        expiry = c.expiry;
        claimed = c.claimed;
        status = c.status;
        recipient = c.recipient;
        requiresSecret = (c.secretHash != bytes32(0));
        isNative = (c.token == NATIVE_CELO);
    }

    function isNativeClaim(string calldata code) external view returns (bool) {
        return claims[code].token == NATIVE_CELO;
    }

    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserClaims(
        address user
    ) external view returns (string[] memory) {
        return userClaims[user];
    }

    function getUserClaimCount(address user) external view returns (uint256) {
        return userClaims[user].length;
    }

    receive() external payable {}

    fallback() external payable {
        revert("Function not found");
    }
}
