require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html

task("propose", "Proposes the incentive proposal to AAVE Governance").setAction(
  async () => {
    const [deployer] = await ethers.getSigners();

    const aToken = await run("aToken");
    const variableDebtToken = await run("vToken");

    const callData = ethers.utils.defaultAbiCoder.encode(
      ["address[1]", "address[1]"],
      [[aToken], [variableDebtToken]]
    );

    const executeSignature = "execute(address[1],address[1])";

    const deployedAaveGovernanceAddress =
      "0xEC568fffba86c094cf06b22134B23074DFE2252c";

    const Gov = await ethers.getContractFactory("AaveGovernanceV2");
    const govContract = await Gov.attach(deployedAaveGovernanceAddress);

    const ipfsEncoded =
      "0xf7a1f565fcd7684fba6fea5d77c5e699653e21cb6ae25fbf8c5dbc8d694c7949";

    const shortExecutor = "0xee56e2b3d491590b5b31738cc34d5232f378a8d5";

    const ProposalIncentivesExecutor = await ethers.getContractFactory(
      "ProposalSUSDIncentivesExecutor"
    );
    const proposalIncentivesExecutor = await ProposalIncentivesExecutor.connect(
      deployer
    ).deploy();

    /*
      IExecutorWithTimelock executor,
      address[] memory targets,
      uint256[] memory values,
      string[] memory signatures,
      bytes[] memory calldatas,
      bool[] memory withDelegatecalls,
      bytes32 ipfsHash
    */

    try {
      const tx = await govContract.create(
        shortExecutor,
        [proposalIncentivesExecutor.address],
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
);

subtask("aToken", "Deploys an instance of the sUSD A Token", async () => {
  const [deployer] = await ethers.getSigners();

  const [
    pool,
    asset,
    treasury,
    tokenName,
    tokenSymbol,
    incentivesController,
  ] = [
    "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
    "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
    "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    "Aave interest bearing SUSD",
    "aSUSD",
    "0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5",
  ];

  const AToken = await ethers.getContractFactory("AToken");

  const aToken = await AToken.connect(deployer).deploy(
    pool,
    asset,
    treasury,
    tokenName,
    tokenSymbol,
    incentivesController
  );

  await aToken.deployed();

  return aToken.address;
});

subtask(
  "vToken",
  "Deploys an instance of the sUSD Variable Debt Token",
  async () => {
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
);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.5",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "istanbul",
        },
      },
      {
        version: "0.6.10",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "istanbul",
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "istanbul",
        },
      },
    ],
  },
};
