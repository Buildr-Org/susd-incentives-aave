// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // @TODO: fill in when deployed
  const [shortExecutor, proposalIncentivesExecutorAddress, ipfsEncoded] = [
    "",
    "",
    "",
  ];

  const [deployer] = await hre.ethers.getSigners();

  const Gov = await ethers.getContractFactory("AaveGovernanceV2");
  const govContract = await Gov.attach(deployedAaveGovernanceAddress);

  const callData = ethers.utils.defaultAbiCoder.encode(
    ["address[1]", "address[1]"],
    [[aToken], [variableDebtToken]]
  );

  const executeSignature = "execute(address[1],address[1])";

  try {
    const tx = await govContract.create(
      shortExecutor,
      [proposalIncentivesExecutorAddress],
      ["0"],
      [executeSignature],
      [callData],
      [true],
      ipfsEncoded,
      { gasLimit: 3000000 }
    );
    console.log("- Proposal submitted to Governance");
    await tx.wait();
  } catch (error) {
    console.log(error.messsage);
    throw error;
  }

  console.log("Your Proposal has been submitted");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((response) => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
