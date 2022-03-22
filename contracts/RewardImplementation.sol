// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./DaoHubReward.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// This contract can be extended for any type of reward contract -- ERC20, ERC721, etc.
contract MyDaoReward is DaoHubReward, Ownable {
    mapping(uint256 => uint256) public streakRewards;

    constructor(address _stateContractAddress, address _daoAddress)
        DaoHubReward(_stateContractAddress, _daoAddress)
    {}

    function setStreakRewards(uint256 streak, uint256 reward) public onlyOwner {
        streakRewards[streak] = reward;
    }

    function claimStreakReward(
        bytes32[] calldata proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap,
        uint256 streakReward
    ) public {
        require(
            verifyUserMetrics(proof, totalTasksClaim, streakClaim, dailyBitMap)
        );
        require(streakClaim > streakRewards[streakReward]);
        (bool sent, ) = msg.sender.call{value: streakRewards[streakReward]}("");
        require(sent, "Failed to send Ether");
    }
}
