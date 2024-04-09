// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {AggregatorInterface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorInterface.sol";

interface ICLSynchronicityPriceAdapter {
  /**
   * @notice Calculates the current answer based on the aggregators.
   */
  function latestAnswer() external view returns (int256);

  error DecimalsAboveLimit();
  error DecimalsNotEqual();
}

interface ICLSynchronicityPriceAdapterPegToBase is ICLSynchronicityPriceAdapter {
    /// @inheritdoc ICLSynchronicityPriceAdapter
    function latestAnswer() external view override returns (int256);
}


//0x230E0321Cf38F09e247e50Afc7801EA2351fe56F
//https://etherscan.io/address/0x230E0321Cf38F09e247e50Afc7801EA2351fe56F#code

contract WBTCUSDPriceFeed is ICLSynchronicityPriceAdapter{

     ICLSynchronicityPriceAdapterPegToBase public immutable WBTC_USD_PRICEFEED;
    constructor(address clsynchronicityPriceAdapterPegToBase){
             WBTC_USD_PRICEFEED= ICLSynchronicityPriceAdapterPegToBase(clsynchronicityPriceAdapterPegToBase);
    }
    function latestAnswer() public view virtual override returns(int256){

         return WBTC_USD_PRICEFEED.latestAnswer()/2;

    }
}