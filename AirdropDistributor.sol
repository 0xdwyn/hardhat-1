// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AirdropDistributor is Ownable {
    IERC20 public immutable token;
    bytes32 public merkleRoot;
    mapping(address => bool) public claimed;
    uint256 public immutable deadline; // unix timestamp

    event Claimed(address indexed account, uint256 amount);
    event MerkleRootUpdated(bytes32 newRoot);
    event Rescue(address indexed to, uint256 amount);

    constructor(address token_, bytes32 merkleRoot_, uint256 deadline_) Ownable(msg.sender) {
        require(token_ != address(0), "token zero");
        require(deadline_ > block.timestamp, "deadline in past");
        token = IERC20(token_);
        merkleRoot = merkleRoot_;
        deadline = deadline_;
    }

    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        require(block.timestamp < deadline, "after deadline");
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    function isEligible(address account, uint256 amount, bytes32[] calldata proof) public view returns (bool) {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        return MerkleProof.verifyCalldata(proof, merkleRoot, leaf);
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        require(block.timestamp < deadline, "claim closed");
        require(!claimed[msg.sender], "already claimed");
        require(isEligible(msg.sender, amount, proof), "not eligible");
        claimed[msg.sender] = true;
        require(token.transfer(msg.sender, amount), "transfer failed");
        emit Claimed(msg.sender, amount);
    }

    function rescueUnclaimed(address to) external onlyOwner {
        require(block.timestamp >= deadline, "before deadline");
        uint256 bal = token.balanceOf(address(this));
        require(bal > 0, "nothing");
        require(token.transfer(to, bal), "transfer failed");
        emit Rescue(to, bal);
    }
}
