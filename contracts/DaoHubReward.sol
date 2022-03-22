// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./DaoHubState.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

// This contract can be extended for any type of reward contract -- ERC20, ERC721, etc.
contract DaoHubReward {
    address public stateContractAddress;
    address public daoAddress;

    constructor(address _stateContractAddress, address _daoAddress) {
        stateContractAddress = _stateContractAddress;
        daoAddress = _daoAddress;
    }

    function verifyUserMetrics(
        bytes32[] memory proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap
    ) public view returns (bool) {
        bytes32 leaf = keccak256(
            abi.encodePacked(
                msg.sender,
                totalTasksClaim,
                streakClaim,
                dailyBitMap
            )
        );
        bytes32 root = DaoHubState(stateContractAddress).getRoot(daoAddress);
        return MerkleProof.verify(proof, root, leaf);
    }

    function getCountOverEpoch(uint256 dailyBitMap, uint256 epoch)
        public
        pure
        returns (uint256)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < epoch; i++) {
            count += dailyBitMap & 1;
            dailyBitMap >>= 1;
        }
        return count;
    }

    function getCurrentSreak(uint256 dailyBitMap)
        public
        pure
        returns (uint256)
    {
        uint256 count = 0;
        while (dailyBitMap & 1 == 1) {
            count++;
            dailyBitMap >>= 1;
        }
        return count;
    }
}
