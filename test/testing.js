const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("", function () {
  let stateContract;
  let signer;
  let signerAddress;

  before(async () => {
    signer = await ethers.getSigner(0);
    signerAddress = signer.address;
  });

  beforeEach(async () => {
    const StateContract = await ethers.getContractFactory("DaoHubState");
    stateContract = await StateContract.deploy();
    await stateContract.deployed();
  });

  it("Should...", async function () {
    assert(true);
  });
});

/*
const res = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "address"],
    ["1", "2", "0x5b38da6a701c568545dcfcb03fcb875f56beddc4"]
  );
*/
