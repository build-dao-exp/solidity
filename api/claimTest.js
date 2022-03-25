const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const { userData } = require("./merkleData.js");
const {
  abi: NFTabi,
} = require("../artifacts/contracts/NFTMilestoneRewardImplementation.sol/MyDaoMilestoneNFTRewards.json");
const {
  abi: etherABI,
} = require("../artifacts/contracts/MilestoneRewardImplementation.sol/MyDaoMilestoneRewards.json");
const {
  createMerkleTree,
  createMerkleProof,
  claimStreakReward,
  claimTotalTaskReward,
} = require("./claim");

const NFT_CONTRACT_ADDRESS = "0x3884663FdB0d00659dA26A8d59075210fE9f3dBB";
const ETHER_CONTRACT_ADDRESS = "";

async function main() {
  const tree = createMerkleTree(userData);
  const proof = createMerkleProof(tree, userData[0]);

  const res = await claimTotalTaskReward(
    NFT_CONTRACT_ADDRESS,
    NFTabi,
    await ethers.getSigner(),
    userData[0],
    proof,
    5
  );
  console.log(res);
  //   const RewardContract = await ethers.getContractFactory(
  //     "MyDaoMilestoneNFTRewards"
  //   );
  //   const rewardContract = await RewardContract.attach(NFT_CONTRACT_ADDRESS);
  //   console.log(await rewardContract.balanceOf(userData[0][0], 4));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
