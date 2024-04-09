import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { IPool } from "../typechain-types";

// WBTC contract address on Ethereum mainnet
const WBTCContractAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";

async function runSimulation(): Promise<IPool> {
  const [operator] = await ethers.getSigners();
  const { liquidityPool, priceOracle } = await setupPoolAndOracle(operator);

  // Etherscan address with administrative privileges
  const adminAddress = "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A";
  // Emulating the admin account
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [adminAddress],
  });
  const adminSigner = await ethers.getSigner(adminAddress);

  // Funding the admin account to facilitate transactions
  await provideFunds(adminAddress);
  const connectedOracle = priceOracle.connect(adminSigner);

  const initialPriceWBTC = await connectedOracle.getAssetPrice(
    WBTCContractAddress
  );
  console.log("Initial WBTC price:", initialPriceWBTC);
  console.log("Half of the initial WBTC price:", initialPriceWBTC / 2n);

  const newPriceFeedContract = await deployNewPriceFeed();
  const updatedWBTCPrice = await newPriceFeedContract.latestAnswer();
  console.log("Updated WBTC price:", updatedWBTCPrice);

  const updateTx = await connectedOracle.setAssetSources(
    [WBTCContractAddress],
    [await newPriceFeedContract.getAddress()]
  );
  await updateTx.wait(1);

  const finalPriceWBTC = await connectedOracle.getAssetPrice(
    WBTCContractAddress
  );
  console.log("Final WBTC price after update:", finalPriceWBTC);

  return liquidityPool;
}

async function setupPoolAndOracle(account: HardhatEthersSigner) {
  const poolAddressProvider = await ethers.getContractAt(
    "IPoolAddressesProvider",
    "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    account
  );
  const liquidityPoolAddress = await poolAddressProvider.getPool();
  const oracleAddress = await poolAddressProvider.getPriceOracle();

  const liquidityPool = await ethers.getContractAt(
    "IPool",
    liquidityPoolAddress,
    account
  );
  const priceOracle = await ethers.getContractAt(
    "IAaveOracle",
    oracleAddress,
    account
  );
  return { liquidityPool, priceOracle };
}

// Deploying a new price feed contract for WBTC, mimicking half the current price
async function deployNewPriceFeed() {
  const wbtcPriceFeedFactory = await ethers.getContractFactory(
    "WBTCUSDPriceFeed"
  );
  const deployedFeed = await wbtcPriceFeedFactory.deploy(
    "0x230E0321Cf38F09e247e50Afc7801EA2351fe56F" // Reference contract address
  );
  await deployedFeed.waitForDeployment();

  console.log(
    "Deployed new WBTCUSDPriceFeed at",
    await deployedFeed.getAddress()
  );
  return deployedFeed;
}

// Transfer ETH to the specified account for gas fees
async function provideFunds(recipient: string) {
  const [funder] = await ethers.getSigners();
  const fundAmount = ethers.parseEther("1"); // Adjusting the fund amount
  const transferTx = await funder.sendTransaction({
    to: recipient,
    value: fundAmount,
  });

  await transferTx.wait(1);
}

export default runSimulation;
