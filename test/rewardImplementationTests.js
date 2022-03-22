const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("DAOHub Milestone Awards", function () {
  let stateContract;
  let rewardImplementationContract;
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

    const RewardImplementationContract = await ethers.getContractFactory(
      "MyDaoMilestoneRewards"
    );
    rewardImplementationContract = await RewardImplementationContract.deploy(
      stateContract.address,
      signers[0].address // Pretend this is the DAO address
    );
    await rewardImplementationContract.deployed();
    await stateContract.instantiateDao("www.google.com", root);

    // Load rewardImplementationContract with ether to distribute as rewards
    let tx = {
      to: rewardImplementationContract.address,
      value: ethers.utils.parseEther("10.0"),
    };
    await wallets[4].sendTransaction(tx);
  });

  it("Should deploy the reward implementation contract with the correct state contract address", async function () {
    assert.equal(
      await rewardImplementationContract.daoAddress(),
      signers[0].address
    );
    assert.equal(
      await rewardImplementationContract.stateContractAddress(),
      stateContract.address
    );
  });

  it("Should allow a user to claim a 5-day streak with a 5-day max streak", async function () {
    // user 0 -- streak 5, total 5
    const initialBalance = await wallets[0].getBalance();
    let proof = tree.getHexProof(leaves[0]);
    await rewardImplementationContract.claimStreakReward(
      proof,
      userData[0][1],
      userData[0][2],
      userData[0][3],
      5
    );
    const newBalance = await wallets[0].getBalance();
    assert(newBalance.gt(initialBalance));
  });

  it("Should allow a user to claim a 5-day streak with a 7-day max streak", async function () {
    // user 1 -- streak 7, total 50
    const initialBalance = await wallets[1].getBalance();
    let proof = tree.getHexProof(leaves[1]);
    await rewardImplementationContract
      .connect(wallets[1])
      .claimStreakReward(
        proof,
        userData[1][1],
        userData[1][2],
        userData[1][3],
        5
      );
    const newBalance = await wallets[1].getBalance();
    assert(newBalance.gt(initialBalance));
  });

  it("Should allow a user to claim a 20-day streak with a 50-day max streak", async function () {
    // user 2 -- streak 50, total 105
    const initialBalance = await wallets[2].getBalance();
    let proof = tree.getHexProof(leaves[2]);
    await rewardImplementationContract
      .connect(wallets[2])
      .claimStreakReward(
        proof,
        userData[2][1],
        userData[2][2],
        userData[2][3],
        20
      );
    const newBalance = await wallets[2].getBalance();
    assert(newBalance.gt(initialBalance));
  });

  it("Should not allow a user to claim a 5-day streak with a 0-day max streak", async function () {
    // user 3 -- streak 0, total 0
    let proof = tree.getHexProof(leaves[3]);
    try {
      await rewardImplementationContract
        .connect(wallets[3])
        .claimStreakReward(
          proof,
          userData[3][1],
          userData[3][2],
          userData[3][3],
          5
        );
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Should not allow a user to claim a 5-day streak twice", async function () {
    // user 2 -- streak 50, total 105
    let proof = tree.getHexProof(leaves[2]);
    // first claim
    await rewardImplementationContract
      .connect(wallets[2])
      .claimStreakReward(
        proof,
        userData[2][1],
        userData[2][2],
        userData[2][3],
        20
      );
    // second claim
    try {
      await rewardImplementationContract
        .connect(wallets[2])
        .claimStreakReward(
          proof,
          userData[2][1],
          userData[2][2],
          userData[2][3],
          20
        );
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Should allow a user to claim a 1-total-task reward with 5 total tasks completed", async function () {
    // user 0 -- streak 5, total 5
    const initialBalance = await wallets[0].getBalance();
    let proof = tree.getHexProof(leaves[0]);
    await rewardImplementationContract.claimTotalTaskReward(
      proof,
      userData[0][1],
      userData[0][2],
      userData[0][3],
      1
    );
    const newBalance = await wallets[0].getBalance();
    assert(newBalance.gt(initialBalance));
  });

  it("Should allow a user to claim both a 20-total-task reward and a 50-total-task reward with 50 total tasks completed", async function () {
    // user 1 -- streak 7, total 50
    const initialBalance = await wallets[1].getBalance();
    let proof = tree.getHexProof(leaves[1]);

    // claim 20 reward
    await rewardImplementationContract
      .connect(wallets[1])
      .claimTotalTaskReward(
        proof,
        userData[1][1],
        userData[1][2],
        userData[1][3],
        20
      );
    const nextBalance = await wallets[1].getBalance();
    assert(nextBalance.gt(initialBalance));

    // claim 50 reward
    await rewardImplementationContract
      .connect(wallets[1])
      .claimTotalTaskReward(
        proof,
        userData[1][1],
        userData[1][2],
        userData[1][3],
        50
      );
    const finalBalance = await wallets[1].getBalance();
    assert(finalBalance.gt(nextBalance));
  });

  it("Should not allow a user to claim a 1-total-task reward with 0 total tasks completed", async function () {
    // user 3 -- streak 0, total 0
    let proof = tree.getHexProof(leaves[3]);
    try {
      await rewardImplementationContract
        .connect(wallets[3])
        .claimTotalTaskReward(
          proof,
          userData[3][1],
          userData[3][2],
          userData[3][3],
          1
        );
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Should not allow a user to claim a 1-total-task reward twice", async function () {
    // user 2 -- streak 50, total 105
    let proof = tree.getHexProof(leaves[2]);
    // first claim
    await rewardImplementationContract
      .connect(wallets[2])
      .claimTotalTaskReward(
        proof,
        userData[2][1],
        userData[2][2],
        userData[2][3],
        1
      );
    // second claim
    try {
      await rewardImplementationContract
        .connect(wallets[2])
        .claimTotalTaskReward(
          proof,
          userData[2][1],
          userData[2][2],
          userData[2][3],
          1
        );
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
});
