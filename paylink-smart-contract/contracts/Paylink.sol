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

    mapping(uint256 => Claim) public claims;
    mapping(string => uint256) public codeToClaimId;
    mapping(address => uint256[]) private userClaims;
    uint256 public nextClaimId = 1;
    bool public paused;

    event ClaimCreated(
        uint256 indexed id,
        address indexed payer,
        address indexed token,
        uint256 amount,
        uint256 expiry,
        address recipient,
        bytes32 secretHash,
        string code
    );

    event Claimed(uint256 indexed id, address indexed claimer, uint256 amount);
    event Reclaimed(uint256 indexed id, address indexed payer, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    modifier notPaused() {
        require(!paused, "contract paused");
        _;
    }

    modifier validCode(string calldata code) {
        require(bytes(code).length > 0, "code cannot be empty");
        require(bytes(code).length <= 64, "code too long");
        require(codeToClaimId[code] == 0, "code already exists");
        _;
    }

    function createClaimNative(
        uint256 expiry,
        address recipient,
        bytes32 secretHash,
        string calldata code
    ) external payable notPaused validCode(code) returns (uint256) {
        require(msg.value > 0, "amount>0");
        require(expiry > block.timestamp, "expiry in future");

        uint256 id = nextClaimId++;
        claims[id] = Claim({
            payer: msg.sender,
            token: NATIVE_CELO,
            amount: msg.value,
            expiry: expiry,
            claimed: false,
            status: ClaimStatus.CREATED,
            recipient: recipient,
            secretHash: secretHash
        });

        codeToClaimId[code] = id;

        userClaims[msg.sender].push(id);

        emit ClaimCreated(
            id,
            msg.sender,
            NATIVE_CELO,
            msg.value,
            expiry,
            recipient,
            secretHash,
            code
        );
        return id;
    }

    function createClaimERC20(
        address token,
        uint256 amount,
        uint256 expiry,
        address recipient,
        bytes32 secretHash,
        string calldata code
    ) external notPaused validCode(code) returns (uint256) {
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
            status: ClaimStatus.CREATED,
            recipient: recipient,
            secretHash: secretHash
        });

        codeToClaimId[code] = id;

        userClaims[msg.sender].push(id);

        emit ClaimCreated(
            id,
            msg.sender,
            token,
            amount,
            expiry,
            recipient,
            secretHash,
            code
        );
        return id;
    }

    function claim(
        uint256 id,
        bytes calldata secret
    ) external nonReentrant notPaused {
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
        c.status = ClaimStatus.CLAIMED;

        if (c.token == NATIVE_CELO) {
            (bool success, ) = payable(msg.sender).call{value: c.amount}("");
            require(success, "CELO transfer failed");
        } else {
            IERC20(c.token).safeTransfer(msg.sender, c.amount);
        }

        emit Claimed(id, msg.sender, c.amount);
    }

    function reclaim(uint256 id) external nonReentrant {
        Claim storage c = claims[id];
        require(!c.claimed, "already claimed");
        require(c.amount > 0, "invalid claim");
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

    function getClaimIdByCode(
        string calldata code
    ) external view returns (uint256) {
        uint256 id = codeToClaimId[code];
        require(id != 0, "invalid code");
        return id;
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
            address recipientMasked,
            bool requiresSecret,
            bool isNative
        )
    {
        id = codeToClaimId[code];
        require(id != 0, "invalid code");

        Claim storage c = claims[id];
        payer = c.payer;
        token = c.token;
        amount = c.amount;
        expiry = c.expiry;
        claimed = c.claimed;
        status = c.status;
        recipientMasked = c.recipient;
        requiresSecret = (c.secretHash != bytes32(0));
        isNative = (c.token == NATIVE_CELO);
    }

    function getClaimPublic(
        uint256 id
    )
        external
        view
        returns (
            address payer,
            address token,
            uint256 amount,
            uint256 expiry,
            bool claimed,
            ClaimStatus status,
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
        status = c.status;
        recipientMasked = c.recipient;
        requiresSecret = (c.secretHash != bytes32(0));
        isNative = (c.token == NATIVE_CELO);
    }

    function isNativeClaim(uint256 id) external view returns (bool) {
        return claims[id].token == NATIVE_CELO;
    }

    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserClaims(
        address user
    ) external view returns (uint256[] memory) {
        return userClaims[user];
    }

    function getUserClaimCount(address user) external view returns (uint256) {
        return userClaims[user].length;
    }

    receive() external payable {
    }

    fallback() external payable {
        revert("Function not found");
    }
}
