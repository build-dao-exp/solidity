const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

let stateContract;
let nftRewardImplementationContract;
let tree;
let root;
let leaves;

const userData = [
  [
    "0x98590dF62A19c0Cca207833f872f2e7B72E33416",
    105, // total
    50, // streak
    parseInt("1111111111111111111111111111111111111", 2),
  ],
  [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    50,
    7,
    parseInt("10111011010101010010001111111", 2),
  ],
  [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    5,
    5,
    parseInt("000000000111111", 2),
  ],
  [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    0,
    0,
    parseInt("0000000000000", 2),
  ],
];

async function main() {
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

  const StateContract = await ethers.getContractFactory("DaoHubState");
  stateContract = await StateContract.deploy();
  await stateContract.deployed();
  console.log("State contract deployed to:", stateContract.address);

  const NftRewardImplementationContract = await ethers.getContractFactory(
    "MyDaoMilestoneNFTRewards"
  );
  nftRewardImplementationContract =
    await NftRewardImplementationContract.deploy(
      stateContract.address,
      userData[0][0]
    );
  await nftRewardImplementationContract.deployed();
  console.log(
    "NFT award contract deployed to:",
    nftRewardImplementationContract.address
  );
  await nftRewardImplementationContract.setURI(
    "https://raw.githubusercontent.com/build-dao-exp/solidity/main/tokens/metadata/{id}.json"
  );
  console.log("NFT award contract URI set");
  await stateContract.instantiateDao("", root);
  console.log("DAO instantiated");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
