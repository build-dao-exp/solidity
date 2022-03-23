const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("General DAOHub Rewards", function () {
  let stateContract;
  let rewardContract;
  let signer;
  let signerAddress;

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
      parseInt("10000000010100000000", 2),
    ],
    [
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      105,
      75,
      parseInt("1111111111111111111111111111111111111", 2),
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

  before(async () => {
    signer = await ethers.getSigner(0);
    signerAddress = signer.address;
  });

  beforeEach(async () => {
    const StateContract = await ethers.getContractFactory("DaoHubState");
    stateContract = await StateContract.deploy();
    await stateContract.deployed();
    stateContract.connect(signer);

    const RewardContract = await ethers.getContractFactory("DaoHubReward");
    rewardContract = await RewardContract.deploy(
      stateContract.address,
      signerAddress // Pretend this is the DAO address
    );
    await rewardContract.deployed();
    rewardContract.connect(signer);
  });

  it("Should deploy a reward contract with the correct state contract address", async function () {
    assert.equal(await rewardContract.daoAddress(), signerAddress);
    assert.equal(
      await rewardContract.stateContractAddress(),
      stateContract.address
    );
  });

  it("Should verify a valid Merkle proof", async function () {
    await stateContract.instantiateDao("www.google.com", root);
    let leaf = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      userData[0]
    );
    let proof = tree.getHexProof(leaf);
    let res = await rewardContract._verifyUserMetrics(
      proof,
      userData[0][1],
      userData[0][2],
      userData[0][3]
    );
    assert(res);
  });

  it("Should not verify an invalid Merkle proof", async function () {
    await stateContract.instantiateDao("www.google.com", root);
    const goodLeaf = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      userData[0]
    );
    let goodProof = tree.getHexProof(goodLeaf);

    let falseData = [...userData[0]];
    falseData[2]++;
    const falseLeaf = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      falseData
    );
    let falseProof = tree.getHexProof(falseLeaf);

    assert(
      !(await rewardContract._verifyUserMetrics(
        goodProof,
        falseData[1],
        falseData[2],
        falseData[3]
      ))
    );
    assert(
      !(await rewardContract._verifyUserMetrics(
        falseProof,
        falseData[1],
        falseData[2],
        falseData[3]
      ))
    );
  });

  it("Should get the correct count over epochs", async function () {
    const dailyMetrics1 = parseInt("001011101001110111", 2);
    const dailyMetrics2 = parseInt("11111111111111111", 2);
    const dailyMetrics3 = parseInt("000000000000000", 2);

    assert.equal(
      3,
      await rewardContract._getCountOverEpoch(dailyMetrics1, "3")
    );
    assert.equal(6, await rewardContract._getCountOverEpoch(dailyMetrics1, 9));
    assert.equal(
      10,
      await rewardContract._getCountOverEpoch(dailyMetrics2, 10)
    );
    assert.equal(0, await rewardContract._getCountOverEpoch(dailyMetrics3, 3));
  });

  it("Should get the correct current streak", async function () {
    const dailyMetrics1 = parseInt("001011101001110111", 2);
    const dailyMetrics2 = parseInt("11111111111111111", 2);
    const dailyMetrics3 = parseInt("000000000000000", 2);

    assert.equal(3, await rewardContract._getCurrentSreak(dailyMetrics1));
    assert.equal(
      dailyMetrics2.toString(2).length,
      await rewardContract._getCurrentSreak(dailyMetrics2)
    );
    assert.equal(0, await rewardContract._getCurrentSreak(dailyMetrics3));
  });
});
