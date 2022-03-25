// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./DaoHubReward.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// This contract can be extended for any type of reward contract -- ERC20, ERC721, etc.
contract MyDaoMilestoneNFTRewards is DaoHubReward, ERC1155, Ownable {
    mapping(uint256 => uint256) public streakTokenIds; // maps from Streak Count => Reward Token ID
    mapping(uint256 => uint256) public totalTaskTokenIds; // maps from Total Task Count => Reward Token ID

    // Used to disable token transfers
    modifier isOverriden() {
        require(
            false,
            "Function call not permitted for non-transferrable tokens"
        );
        _;
    }

    constructor(address _stateContractAddress, address _daoAddress)
        DaoHubReward(_stateContractAddress, _daoAddress)
        ERC1155("")
    {
        streakTokenIds[5] = 1;
        streakTokenIds[10] = 2;
        streakTokenIds[25] = 3;
        totalTaskTokenIds[5] = 4;
        totalTaskTokenIds[50] = 5;
        totalTaskTokenIds[100] = 6;
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
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
        require(
            streakTokenIds[streakReward] != 0,
            "There's no NFT award for this streak."
        );
        // require(
        //     balanceOf(msg.sender, streakTokenIds[streakReward]) == 0,
        //     "NFT already claimed."
        // );
        _mint(msg.sender, streakTokenIds[streakReward], 1, "");
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
        require(
            totalTaskTokenIds[totalTaskReward] != 0,
            "There's no NFT award for this total task count."
        );
        // require(
        //     balanceOf(msg.sender, totalTaskTokenIds[totalTaskReward]) == 0,
        //     "NFT already claimed."
        // );
        _mint(msg.sender, totalTaskTokenIds[totalTaskReward], 1, "");
    }

    // OVERRIDE TRANSFERS
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override isOverriden {}

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override isOverriden {}

    function setApprovalForAll(address operator, bool approved)
        public
        override
        isOverriden
    {}

    receive() external payable {}
}
