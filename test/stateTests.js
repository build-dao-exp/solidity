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
      stateContract.updateRoot(EXAMPLE_ROOT);
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
});

// 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
// 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
// 0x90F79bf6EB2c4f870365E785982E1f101E93b906
// 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
// 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
// 0x976EA74026E726554dB657fA54763abd0C3a0aa9
// 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955
// 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f
// 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720
// 0xBcd4042DE499D14e55001CcbB24a551F3b954096
