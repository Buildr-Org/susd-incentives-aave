// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

import {IERC20} from '@aave/aave-stake/contracts/interfaces/IERC20.sol';
import {ILendingPoolAddressesProvider} from '../interfaces/ILendingPoolAddressesProvider.sol';
import {ILendingPoolConfigurator} from '../interfaces/ILendingPoolConfigurator.sol';
import {IAaveIncentivesController} from '../interfaces/IAaveIncentivesController.sol';
import {IAaveEcosystemReserveController} from '../interfaces/IAaveEcosystemReserveController.sol';
import {IProposalIncentivesExecutor} from '../interfaces/IProposalIncentivesExecutor.sol';
import {DistributionTypes} from '../lib/DistributionTypes.sol';
import {DataTypes} from '../utils/DataTypes.sol';
import {ILendingPoolData} from '../interfaces/ILendingPoolData.sol';
import {IATokenDetailed} from '../interfaces/IATokenDetailed.sol';
import {PercentageMath} from '../utils/PercentageMath.sol';
import {SafeMath} from '../lib/SafeMath.sol';

contract ProposalSUSDIncentivesExecutor is IProposalIncentivesExecutor {
  using SafeMath for uint256;
  using PercentageMath for uint256;

  address constant AAVE_TOKEN = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9;
  address constant POOL_CONFIGURATOR = 0x311Bb771e4F8952E6Da169b425E7e92d6Ac45756;
  address constant ADDRESSES_PROVIDER = 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5;
  address constant LENDING_POOL = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
  address constant ECO_RESERVE_ADDRESS = 0x1E506cbb6721B83B1549fa1558332381Ffa61A93;
  address constant INCENTIVES_CONTROLLER_PROXY_ADDRESS = 0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5;
  address constant INCENTIVES_CONTROLLER_IMPL_ADDRESS = 0x83D055D382f25e6793099713505c68a5C7535a35;

  uint256 constant DISTRIBUTION_DURATION = 7776000; // 90 days
  uint256 constant DISTRIBUTION_AMOUNT = 198000000000000000000000; // 198000 AAVE during 90 days

  function execute(
    address[1] memory aTokenImplementations,
    address[1] memory variableDebtImplementations
  ) external override {
    uint256 tokensCounter;

    address[] memory assets = new address[](2);

    // Reserves Order: sUSD
    address payable[1] memory reserves = [0x57Ab1ec28D129707052df4dF418D58a2D46d5f51];

    uint256[] memory emissions = new uint256[](2);

    emissions[0] = 92939814814815; //aGUSD
    emissions[1] = 92939814814815; //vDebtGUSD

    ILendingPoolConfigurator poolConfigurator = ILendingPoolConfigurator(POOL_CONFIGURATOR);
    IAaveIncentivesController incentivesController =
      IAaveIncentivesController(INCENTIVES_CONTROLLER_PROXY_ADDRESS);
    IAaveEcosystemReserveController ecosystemReserveController =
      IAaveEcosystemReserveController(ECO_RESERVE_ADDRESS);

    ILendingPoolAddressesProvider provider = ILendingPoolAddressesProvider(ADDRESSES_PROVIDER);

    //adding the incentives controller proxy to the addresses provider
    provider.setAddress(keccak256('INCENTIVES_CONTROLLER'), INCENTIVES_CONTROLLER_PROXY_ADDRESS);

    //updating the implementation of the incentives controller proxy
    provider.setAddressAsProxy(keccak256('INCENTIVES_CONTROLLER'), INCENTIVES_CONTROLLER_IMPL_ADDRESS);

    require(
      aTokenImplementations.length == variableDebtImplementations.length &&
        aTokenImplementations.length == reserves.length,
      'ARRAY_LENGTH_MISMATCH'
    );

    // Update each reserve AToken implementation, Debt implementation, and prepare incentives configuration input
    for (uint256 x = 0; x < reserves.length; x++) {
      require(
        IATokenDetailed(aTokenImplementations[x]).UNDERLYING_ASSET_ADDRESS() == reserves[x],
        'AToken underlying does not match'
      );
      require(
        IATokenDetailed(variableDebtImplementations[x]).UNDERLYING_ASSET_ADDRESS() == reserves[x],
        'Debt Token underlying does not match'
      );
      DataTypes.ReserveData memory reserveData =
        ILendingPoolData(LENDING_POOL).getReserveData(reserves[x]);

      // Update aToken impl
      poolConfigurator.updateAToken(reserves[x], aTokenImplementations[x]);

      // Update variable debt impl
      poolConfigurator.updateVariableDebtToken(reserves[x], variableDebtImplementations[x]);

      assets[tokensCounter++] = reserveData.aTokenAddress;

      // Configure variable debt token at incentives controller
      assets[tokensCounter++] = reserveData.variableDebtTokenAddress;

    }
    // Transfer AAVE funds to the Incentives Controller
    ecosystemReserveController.transfer(
      AAVE_TOKEN,
      INCENTIVES_CONTROLLER_PROXY_ADDRESS,
      DISTRIBUTION_AMOUNT
    );

    // Enable incentives in aTokens and Variable Debt tokens
    incentivesController.configureAssets(assets, emissions);

    // Sets the end date for the distribution
    incentivesController.setDistributionEnd(block.timestamp + DISTRIBUTION_DURATION);
  }
}
