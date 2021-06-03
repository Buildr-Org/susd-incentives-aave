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

  const [deployer] = await ethers.getSigners();

  const [pool, asset, tokenName, tokenSymbol, incentivesController] = [
    "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
    "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
    "Aave variable debt bearing SUSD",
    "variableDebtSUSD",
    "0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5",
  ];

  const VToken = await ethers.getContractFactory("VariableDebtToken");

  const vToken = await VToken.connect(deployer).deploy(
    pool,
    asset,
    tokenName,
    tokenSymbol,
    incentivesController
  );

  await vToken.deployed();

  return vToken.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((response) => {
    console.log(`Variable Debt sUSD is deployed at ${response}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
