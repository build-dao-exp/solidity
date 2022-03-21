// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./DaoHubReward.sol";

// This contract can be extended for any type of reward contract -- ERC20, ERC721, etc.
contract MyDaoReward is DaoHubReward {
    constructor(address _stateContractAddress, address _daoAddress)
        DaoHubReward(_stateContractAddress, _daoAddress)
    {}

    function claimFiveDayStreak(
        bytes32[] calldata proof,
        uint256 totalTasksClaim,
        uint256 streakClaim
    ) public OnlyApprovedUser(0, 5, proof, totalTasksClaim, streakClaim) {
        (bool sent, ) = msg.sender.call{value: 0.1 ether}("");
        require(sent, "Failed to send Ether");
    }
}
