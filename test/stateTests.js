const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAOHub State", function () {
  let stateContract;
  let signer;
  let signerAddress;
  const DUMMMY_URL = "www.google.com";
  const EXAMPLE_ROOT =
    "0xb261fdbc5f477518d992875aaccd302dce23d92e3f14df0e9273c28ff2a24f12";

  before(async () => {
    signer = await ethers.getSigner(0);
    signerAddress = signer.address;
  });

  beforeEach(async () => {
    const StateContract = await ethers.getContractFactory("DaoHubState");
    stateContract = await StateContract.deploy();
    await stateContract.deployed();
    stateContract.connect(signer);
  });

  it("Should instantiate a DAO", async function () {
    await stateContract.instantiateDao(DUMMMY_URL, EXAMPLE_ROOT);
    const res = await stateContract.getRoot(signerAddress);
    assert.equal(res, EXAMPLE_ROOT);
  });

  it("Should update a DAO's root", async function () {
    await stateContract.instantiateDao(
      DUMMMY_URL,
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
    const originalRoot = await stateContract.getRoot(signerAddress);
    await stateContract.updateRoot(EXAMPLE_ROOT);
    const newRoot = await stateContract.getRoot(signerAddress);
    assert.notEqual(originalRoot, newRoot);
    assert.equal(newRoot, EXAMPLE_ROOT);
  });

  it("Should not allow updates to an uninstantiated DAO", async function () {
    try {
      await stateContract.updateRoot(EXAMPLE_ROOT);
    } catch (err) {
      assert(true);
      return;
    }
    assert(false);
  });
});
