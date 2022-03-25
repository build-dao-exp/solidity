const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

function createMerkleTree(userData) {
  const leaves = userData.map((v) =>
    ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [...v]
    )
  );
  const tree = new MerkleTree(leaves, keccak256, {
    sortPairs: true,
  });
  return tree;
}

function createMerkleProof(merkleTree, userDataLeafUnhashed) {
  const userDataLeafHashed = ethers.utils.solidityKeccak256(
    ["address", "uint256", "uint256", "uint256"],
    [...userDataLeafUnhashed]
  );
  const proof = merkleTree.getHexProof(userDataLeafHashed);
  return proof;
}

async function claimStreakReward(
  rewardContractaddress,
  rewardContractAbi,
  signer,
  userDataLeafUnhashed,
  proof,
  streakMilestone
) {
  const rewardContract = new ethers.Contract(
    rewardContractaddress,
    rewardContractAbi,
    signer
  );
  await rewardContract.claimStreakReward(
    proof,
    userDataLeafUnhashed[1],
    userDataLeafUnhashed[2],
    userDataLeafUnhashed[3],
    streakMilestone
  );
}

async function claimTotalTaskReward(
  rewardContractaddress,
  rewardContractAbi,
  signer,
  userDataLeafUnhashed,
  proof,
  totalTaskMilestone
) {
  const rewardContract = new ethers.Contract(
    rewardContractaddress,
    rewardContractAbi,
    signer
  );
  await rewardContract.claimTotalTaskReward(
    proof,
    userDataLeafUnhashed[1],
    userDataLeafUnhashed[2],
    userDataLeafUnhashed[3],
    totalTaskMilestone
  );
}

module.exports = {
  createMerkleTree,
  createMerkleProof,
  claimStreakReward,
  claimTotalTaskReward,
};
