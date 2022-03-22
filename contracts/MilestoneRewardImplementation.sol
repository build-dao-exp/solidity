// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./DaoHubReward.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyDaoMilestoneRewards is DaoHubReward, Ownable {
    mapping(uint256 => uint256) public streakRewards;
    mapping(uint256 => mapping(address => bool)) public streakRewardLogs;
    mapping(uint256 => uint256) public totalTaskRewards;
    mapping(uint256 => mapping(address => bool)) public totalTaskRewardLogs;

    constructor(address _stateContractAddress, address _daoAddress)
        DaoHubReward(_stateContractAddress, _daoAddress)
    {
        streakRewards[5] = 0.1 * (10**18);
        streakRewards[10] = 0.2 * (10**18);
        streakRewards[20] = 0.5 * (10**18);
        totalTaskRewards[1] = 0.01 * (10**18);
        totalTaskRewards[20] = 0.2 * (10**18);
        totalTaskRewards[50] = 0.5 * (10**18);
    }

    function setStreakRewards(uint256 streak, uint256 reward) public onlyOwner {
        streakRewards[streak] = reward;
    }

    function claimStreakReward(
        bytes32[] calldata proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap,
        uint256 streakReward
    )
        public
        RequiresMinLongestStreak(
            streakReward,
            proof,
            totalTasksClaim,
            streakClaim,
            dailyBitMap
        )
    {
        (bool sent, ) = msg.sender.call{value: streakRewards[streakReward]}("");
        require(sent, "Failed to send Ether");
        streakRewardLogs[streakReward][msg.sender] = true;
    }

    function claimTotalTaskReward(
        bytes32[] calldata proof,
        uint256 totalTasksClaim,
        uint256 streakClaim,
        uint256 dailyBitMap,
        uint256 totalTaskReward
    )
        public
        RequiresMinTotalTasks(
            totalTaskReward,
            proof,
            totalTasksClaim,
            streakClaim,
            dailyBitMap
        )
    {
        (bool sent, ) = msg.sender.call{
            value: totalTaskRewards[totalTaskReward]
        }("");
        require(sent, "Failed to send Ether");
        totalTaskRewardLogs[totalTaskReward][msg.sender] = true;
    }

    receive() external payable {}
}
