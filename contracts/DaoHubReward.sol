// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./DaoHubState.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

// This contract can be extended for any type of reward contract -- ERC20, ERC721, etc.
contract DaoHubReward {
    address public stateContractAddress; // address of the contract storing the Merkle root of the reward state
    address public daoAddress; // the DAO issuing rewards through this contract... likely a multisig address

    // to gate functions based on users who have completed a certain number of tasks
    // @param minTask: the min number of tasks a user must have completed
    // @param totalTasksClaim: the actual number of tasks a user has completed, which is verified by Merkle proof
    modifier RequiresMinTotalTasks(
        uint256 minTask,
        bytes32[] memory proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap
    ) {
        require(
            totalTasksClaim >= minTask &&
                _verifyUserMetrics(
                    proof,
                    totalTasksClaim,
                    streakClaim,
                    dailyBitMap
                )
        );
        _;
    }

    // to gate functions based on users who have reached a certain streak length
    // @param minLongestStreak: the min streak a user must have achieved
    // @param streakClaim: the actual longest streak a user has achieved, which is verified by the Merkle proof
    modifier RequiresMinLongestStreak(
        uint256 minLongestStreak,
        bytes32[] memory proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap
    ) {
        require(
            streakClaim >= minLongestStreak &&
                _verifyUserMetrics(
                    proof,
                    totalTasksClaim,
                    streakClaim,
                    dailyBitMap
                )
        );
        _;
    }

    // to gate functions based on users who have completed a certain number of tasks during a certain period
    // @param epochTaskCount: the min number of tasks the user must have completed over the epoch
    // @param epochLength: the number of days over which the user must have completed these tasks
    modifier RequiresTasksDuringEpoch(
        uint256 epochTaskCount,
        uint256 epochLength,
        bytes32[] memory proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap
    ) {
        require(
            _getCountOverEpoch(dailyBitMap, epochLength) >= epochTaskCount &&
                _verifyUserMetrics(
                    proof,
                    totalTasksClaim,
                    streakClaim,
                    dailyBitMap
                )
        );
        _;
    }

    // to gate functions based on users who have completed a certain number of tasks during the past X days
    // @param minCurrentStreak: the min current streak a user must have, which is verified by the dailyBitMap and the Merkle proof
    modifier RequiresCurrentStreak(
        uint256 minCurrentStreak,
        bytes32[] memory proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap
    ) {
        require(
            _getCurrentSreak(dailyBitMap) >= minCurrentStreak &&
                _verifyUserMetrics(
                    proof,
                    totalTasksClaim,
                    streakClaim,
                    dailyBitMap
                )
        );
        _;
    }

    constructor(address _stateContractAddress, address _daoAddress) {
        stateContractAddress = _stateContractAddress;
        daoAddress = _daoAddress;
    }

    function _verifyUserMetrics(
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

    function _getCountOverEpoch(uint256 dailyBitMap, uint256 epoch)
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

    function _getCurrentSreak(uint256 dailyBitMap)
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
