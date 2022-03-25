const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const {
  abi: stateContractAbi,
} = require("../artifacts/contracts/DaoHubState.sol/DaoHubState.json");
const { userData } = require("../api/merkleData.js");

let nftRewardImplementationContract;
var stateContract;
let tree;
let root;
let leaves;

async function main() {
  // Get Merkle root
  leaves = userData.map((v) =>
    ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [...v]
    )
  );
  tree = new MerkleTree(leaves, keccak256, {
    sortPairs: true,
  });
  root = tree.getHexRoot();
  console.log("User data Merkle root generated.");

  // Deploy State contract
  const StateContract = await ethers.getContractFactory("DaoHubState");
  stateContract = await StateContract.deploy();
  await stateContract.deployed();
  console.log("State contract deployed to:", stateContract.address);
  // const STATE_CONTRACT_ADDRESS = "0xb282c97fea51f8Fd87ac0a5579f5B32Ec96caAF7";
  const STATE_CONTRACT_ADDRESS = stateContract.address;

  // Set state contract to include the merkle root for this DAO's user data
  //   stateContract = new ethers.Contract(
  //     STATE_CONTRACT_ADDRESS,
  //     stateContractAbi,
  //     await ethers.getSigner()
  //   );
  await stateContract.instantiateDao("", root);
  console.log("DAO instantiated in state contract with Merkle root.");

  // Update instantiated DAO's root
  //   const stateContract = new ethers.Contract(
  //     STATE_CONTRACT_ADDRESS,
  //     stateContractAbi,
  //     await ethers.getSigner()
  //   );
  //   await stateContract.updateRoot(root);
  //   console.log("DAO instantiated in state contract with Merkle root.");

  // Create NFT reward contract, pretending that sender is the DAO admin account
  // Point award contract to the state contract
  const NftRewardImplementationContract = await ethers.getContractFactory(
    "MyDaoMilestoneNFTRewards"
  );
  nftRewardImplementationContract =
    await NftRewardImplementationContract.deploy(
      STATE_CONTRACT_ADDRESS,
      userData[0][0]
    );
  await nftRewardImplementationContract.deployed();
  console.log(
    "NFT award contract deployed to:",
    nftRewardImplementationContract.address
  );

  // Set URI to point to metadata on github with the relevant reward NFT data
  await nftRewardImplementationContract.setURI(
    "https://raw.githubusercontent.com/build-dao-exp/solidity/main/tokens/metadata/{id}.json"
  );
  console.log("NFT award contract URI set");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
