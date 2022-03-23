const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

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

  const NftRewardImplementationContract = await ethers.getContractFactory(
    "MyDaoMilestoneNFTRewards"
  );
  nftRewardImplementationContract =
    await NftRewardImplementationContract.attach(
      "0x032DD45A845ef3f688f79854A3aE2F799F7D44FA"
    );

  let proof = tree.getHexProof(leaves[0]);
  await nftRewardImplementationContract.claimStreakReward(
    proof,
    userData[0][1],
    userData[0][2],
    userData[0][3],
    5
  );
  console.log("success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
