// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./DaoHubState.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// This contract can be extended for any type of reward contract -- ERC20, ERC721, etc.
contract DaoHubReward {
    address stateContractAddress;
    address daoAddress;

    modifier OnlyApprovedUser(
        uint256 minTotalTasks,
        uint256 minStreak,
        bytes32[] memory proof,
        uint256 totalTasksClaim,
        uint256 streakClaim
    ) {
        // Verify that the sender's claim satisfies the required minTotalTasks and minStreaks
        require((totalTasksClaim > minTotalTasks) && (streakClaim > minStreak));

        // Verify the merkle proof
        bytes32 leaf = keccak256(
            abi.encode(totalTasksClaim, streakClaim, msg.sender)
        );
        bytes32 root = DaoHubState(stateContractAddress).getRoot(daoAddress);
        require(MerkleProof.verify(proof, root, leaf));
        _;
    }

    constructor(address _stateContractAddress, address _daoAddress) {
        stateContractAddress = _stateContractAddress;
        daoAddress = _daoAddress;
    }

    // function test(uint256 totalTasksClaim, uint256 streakClaim) public view returns (bytes32) {
    //     return keccak256(abi.encode(totalTasksClaim, streakClaim, msg.sender));
    // }
}
