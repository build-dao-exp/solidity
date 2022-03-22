const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const { assert } = require("chai");

describe("Merkle Trees", function () {
  const userData = [
    [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      2,
      1,
      parseInt("000010001", 2),
    ],
    [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      3,
      0,
      parseInt("100010100000000", 2),
    ],
    [
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      105,
      75,
      parseInt("11111111111111", 2),
    ],
    [
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      6,
      6,
      parseInt("00000111111", 2),
    ],
  ];

  const leaves = userData.map((v) =>
    ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [...v]
    )
  );

  const tree = new MerkleTree(leaves, keccak256, {
    sortPairs: true,
  });
  const root = tree.getHexRoot();
  console.log(root);

  before(async () => {});
  beforeEach(async () => {});

  it("Should accept a valid merkle proof", async function () {
    const leaf = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      userData[0]
    );

    const proof = tree.getHexProof(leaf);
    const res = tree.verify(proof, leaf, root);
    assert(res);
  });

  it("Should not accept an invalid merkle proof", async function () {
    let falseData = [...userData[0]];
    falseData[3]++;

    const falseLeaf = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      falseData
    );
    const leaf = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      userData[0]
    );

    // Using false leaf to attempt to create a proof
    const proof1 = tree.getHexProof(falseLeaf);
    const res1 = tree.verify(proof1, falseLeaf, root);

    // Using false leaf to attempt to satisfy a proof that was created using a valid leaf
    const proof2 = tree.getHexProof(leaf);
    const res2 = tree.verify(proof2, falseLeaf, root);

    assert(!res1 && !res2);
  });
});
