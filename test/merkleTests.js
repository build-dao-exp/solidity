const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const { assert } = require("chai");

describe("Merkle Trees", function () {
  before(async () => {});

  beforeEach(async () => {});

  it("Should accept a valid merkle proof", async function () {
    const userData = [
      ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 2, 1],
      ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 3, 0],
      ["0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 105, 75],
      ["0x90F79bf6EB2c4f870365E785982E1f101E93b906", 6, 6],
    ];

    const leaves = userData.map((v) =>
      ethers.utils.solidityKeccak256(["address", "uint256", "uint256"], [...v])
    );

    const tree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
    });

    const root = tree.getHexRoot();
    const leaf = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256"],
      userData[0]
    );

    const proof = tree.getHexProof(leaf);
    const res = tree.verify(proof, leaf, root);
    assert(res);
  });
});
