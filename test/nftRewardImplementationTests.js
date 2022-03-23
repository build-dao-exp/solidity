const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("DAOHub NFT Milestone Awards", function () {
  let stateContract;
  let nftRewardImplementationContract;
  let signers;
  let tree;
  let root;
  let leaves;

  const walletKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  ];
  let wallets = [];

  const userData = [
    [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      5, // total
      5, // streak
      parseInt("000000000111111", 2),
    ],
    [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      50,
      7,
      parseInt("10111011010101010010001111111", 2),
    ],
    [
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      105,
      50,
      parseInt("1111111111111111111111111111111111111", 2),
    ],
    [
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      0,
      0,
      parseInt("0000000000000", 2),
    ],
  ];

  before(async () => {
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
    signers = await ethers.getSigners();
    for (const k of walletKeys) {
      wallets.push(await new ethers.Wallet(k, signers[0].provider));
    }
  });

  beforeEach(async () => {
    const StateContract = await ethers.getContractFactory("DaoHubState");
    stateContract = await StateContract.deploy();
    await stateContract.deployed();

    const NftRewardImplementationContract = await ethers.getContractFactory(
      "MyDaoMilestoneNFTRewards"
    );
    nftRewardImplementationContract =
      await NftRewardImplementationContract.deploy(
        stateContract.address,
        signers[0].address // Pretend this is the DAO address
      );
    await nftRewardImplementationContract.deployed();
    await stateContract.instantiateDao("www.google.com", root);
  });

  it("Should deploy the reward implementation contract with the correct state contract address", async function () {
    assert.equal(
      await nftRewardImplementationContract.daoAddress(),
      signers[0].address
    );
    assert.equal(
      await nftRewardImplementationContract.stateContractAddress(),
      stateContract.address
    );
  });

  it("Should allow a user to claim a 5-day streak with a 5-day max streak", async function () {
    // user 0 -- streak 5, total 5
    const initialBalance = await nftRewardImplementationContract.balanceOf(
      signers[0].address,
      await nftRewardImplementationContract.streakTokenIds(5)
    );
    let proof = tree.getHexProof(leaves[0]);
    await nftRewardImplementationContract.claimStreakReward(
      proof,
      userData[0][1],
      userData[0][2],
      userData[0][3],
      5
    );
    const newBalance = await nftRewardImplementationContract.balanceOf(
      signers[0].address,
      await nftRewardImplementationContract.streakTokenIds(5)
    );
    assert(initialBalance == 0);
    assert(newBalance == 1);
  });

  it("Should allow a user to claim a 5-day streak with a 7-day max streak", async function () {
    // user 1 -- streak 7, total 50
    userIdx = 1;
    streakNum = 5;
    const initialBalance = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.streakTokenIds(streakNum)
    );
    let proof = tree.getHexProof(leaves[userIdx]);
    await nftRewardImplementationContract
      .connect(wallets[userIdx])
      .claimStreakReward(
        proof,
        userData[userIdx][1],
        userData[userIdx][2],
        userData[userIdx][3],
        streakNum
      );
    const newBalance = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.streakTokenIds(streakNum)
    );
    assert(initialBalance == 0);
    assert(newBalance == 1);
  });

  it("Should allow a user to claim a 25-day streak with a 50-day max streak", async function () {
    // user 2 -- streak 50, total 105
    userIdx = 2;
    streakNum = 25;
    const initialBalance = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.streakTokenIds(streakNum)
    );
    let proof = tree.getHexProof(leaves[userIdx]);
    await nftRewardImplementationContract
      .connect(wallets[userIdx])
      .claimStreakReward(
        proof,
        userData[userIdx][1],
        userData[userIdx][2],
        userData[userIdx][3],
        streakNum
      );
    const newBalance = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.streakTokenIds(streakNum)
    );
    assert(initialBalance == 0);
    assert(newBalance == 1);
  });

  it("Should not allow a user to claim a 5-day streak with a 0-day max streak", async function () {
    // user 3 -- streak 0, total 0
    userIdx = 3;
    streakNum = 5;

    let proof = tree.getHexProof(leaves[userIdx]);
    try {
      await nftRewardImplementationContract
        .connect(wallets[userIdx])
        .claimStreakReward(
          proof,
          userData[userIdx][1],
          userData[userIdx][2],
          userData[userIdx][3],
          streakNum
        );
    } catch (err) {
      assert(err);
      return;
    }
    assert(false);
  });

  it("Should not allow a user to claim a 5-day streak twice", async function () {
    // user 2 -- streak 50, total 105
    userIdx = 2;
    streakNum = 5;

    let proof = tree.getHexProof(leaves[userIdx]);
    // first claim
    await nftRewardImplementationContract
      .connect(wallets[userIdx])
      .claimStreakReward(
        proof,
        userData[userIdx][1],
        userData[userIdx][2],
        userData[userIdx][3],
        streakNum
      );
    // second claim
    try {
      await nftRewardImplementationContract
        .connect(wallets[userIdx])
        .claimStreakReward(
          proof,
          userData[userIdx][1],
          userData[userIdx][2],
          userData[userIdx][3],
          streakNum
        );
    } catch (err) {
      assert(err);
      return;
    }
    assert(false);
  });

  it("Should allow a user to claim a 5-total-task reward with 5 total tasks completed", async function () {
    // user 0 -- streak 5, total 5
    userIdx = 0;
    taskNum = 5;
    const initialBalance = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.totalTaskTokenIds(taskNum)
    );
    let proof = tree.getHexProof(leaves[userIdx]);

    await nftRewardImplementationContract
      .connect(wallets[userIdx])
      .claimTotalTaskReward(
        proof,
        userData[userIdx][1],
        userData[userIdx][2],
        userData[userIdx][3],
        taskNum
      );
    const newBalance = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.totalTaskTokenIds(taskNum)
    );
    assert(initialBalance == 0);
    assert(newBalance == 1);
  });

  it("Should allow a user to claim both a 5-total-task reward and a 50-total-task reward with 50 total tasks completed", async function () {
    // user 1 -- streak 7, total 50
    userIdx = 1;
    taskNum1 = 5;
    taskNum2 = 50;
    const initialBalance1 = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.totalTaskTokenIds(taskNum1)
    );
    const initialBalance2 = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.totalTaskTokenIds(taskNum2)
    );
    let proof = tree.getHexProof(leaves[userIdx]);

    // claim 5 reward
    await nftRewardImplementationContract
      .connect(wallets[userIdx])
      .claimTotalTaskReward(
        proof,
        userData[userIdx][1],
        userData[userIdx][2],
        userData[userIdx][3],
        taskNum1
      );
    // claim 50 reward
    await nftRewardImplementationContract
      .connect(wallets[userIdx])
      .claimTotalTaskReward(
        proof,
        userData[userIdx][1],
        userData[userIdx][2],
        userData[userIdx][3],
        taskNum2
      );
    const finalBalance1 = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.totalTaskTokenIds(taskNum1)
    );
    const finalBalance2 = await nftRewardImplementationContract.balanceOf(
      signers[userIdx].address,
      await nftRewardImplementationContract.totalTaskTokenIds(taskNum2)
    );
    assert(initialBalance1 + initialBalance2 == 0);
    assert(finalBalance1 == 1);
    assert(finalBalance2 == 1);
  });

  it("Should not allow a user to claim a 5-total-task reward with 0 total tasks completed", async function () {
    // user 3 -- streak 0, total 0
    userIdx = 3;
    taskNum = 5;
    let proof = tree.getHexProof(leaves[userIdx]);
    try {
      await nftRewardImplementationContract
        .connect(wallets[userIdx])
        .claimTotalTaskReward(
          proof,
          userData[userIdx][1],
          userData[userIdx][2],
          userData[userIdx][3],
          taskNum
        );
    } catch (err) {
      assert(err, "failed");
      return;
    }
    assert(false);
  });

  it("Should not allow a user to claim a 5-total-task reward twice", async function () {
    // user 2 -- streak 50, total 105
    userIdx = 2;
    taskNum = 5;
    let proof = tree.getHexProof(leaves[userIdx]);
    // first claim
    await nftRewardImplementationContract
      .connect(wallets[userIdx])
      .claimTotalTaskReward(
        proof,
        userData[userIdx][1],
        userData[userIdx][2],
        userData[userIdx][3],
        taskNum
      );
    // second claim
    try {
      await nftRewardImplementationContract
        .connect(wallets[userIdx])
        .claimTotalTaskReward(
          proof,
          userData[userIdx][1],
          userData[userIdx][2],
          userData[userIdx][3],
          taskNum
        );
    } catch (err) {
      assert(err);
      return;
    }
    assert(false);
  });
});
