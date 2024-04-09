import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { network, ethers } from "hardhat";
import { IPool } from "../typechain-types";

//https://etherscan.io/address/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
async function simulation(): Promise<IPool> {
  const [deployer] = await ethers.getSigners();
  const { pool, oracle } = await getPoolAndOracle(deployer);

  console.log("Pool Address ", await pool.getAddress());
  // console.log("Oracle ", oracle.address);
  //https://etherscan.io/address/0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e#readContract
  const ACLAdmin = "0x5300A1a15135EA4dc7aD5a167152C01EFc9b192A";
  //impersonating  owner account
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [ACLAdmin],
  });
  const signer = await ethers.getSigner(ACLAdmin);
  //since only admin can change price source of an asset
  //sends some eth to signer

  await getFund(ACLAdmin);
  const oracleContract = oracle.connect(signer);

  // console.log(oracleContract.address);

  const currentWBTCPrice = await oracleContract.getAssetPrice(WBTC);

  console.log("current price of WBTC ", currentWBTCPrice);
  console.log("current price of WBTC/2", currentWBTCPrice / 2n);

  const newWBTCUSDPricefeed = await getnewPriceFeed();

  const priceOfWBTC = await newWBTCUSDPricefeed.latestAnswer();

  console.log("pric of wbtc is : ", priceOfWBTC);

  const tx = await oracleContract.setAssetSources(
    [WBTC],
    [await newWBTCUSDPricefeed.getAddress()]
  );
  await tx.wait(1);
  const priceAfterChangingPriceFeed = await oracleContract.getAssetPrice(WBTC);

  console.log("updated price of WBTC ", priceAfterChangingPriceFeed);

  //await getuserinfo("0xfff9520630aa6f84464e2095f052a218dfde923f",pool);
  return pool;
}

// get the current pool contract and corresponding oracle
async function getPoolAndOracle(account: HardhatEthersSigner) {
  //https://etherscan.io/address/0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e
  const poolAddressProviderV3 = await ethers.getContractAt(
    "IPoolAddressesProvider",
    "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
    account
  );
  const poolAddress = await poolAddressProviderV3.getPool();
  const OracleAddress = await poolAddressProviderV3.getPriceOracle();
  const pool = await ethers.getContractAt("IPool", poolAddress, account);
  const oracle = await ethers.getContractAt(
    "IAaveOracle",
    OracleAddress,
    account
  );
  return { pool, oracle };
}
// deploy a new pricefeed which returns the WBTC as WBTC/2 and inherits ICLSynchronicityPriceAdapter
async function getnewPriceFeed() {
  //https://etherscan.io/address/0x230E0321Cf38F09e247e50Afc7801EA2351fe56F
  const wbtcusdContract = await ethers.getContractFactory("WBTCUSDPriceFeed");
  const wbtcusd = await wbtcusdContract.deploy(
    "0x230E0321Cf38F09e247e50Afc7801EA2351fe56F"
  );
  await wbtcusd.waitForDeployment();

  console.log(
    "New WBTCUSDPricefeed Contract deployed at ",
    await wbtcusd.getAddress()
  );
  //0x32cd5ecdA7f2B8633C00A0434DE28Db111E60636

  const priceofWBTV = await wbtcusd.latestAnswer();
  // console.log(priceofWBTV);
  return wbtcusd;
}

//send native funds to account
async function getFund(account: string) {
  const [sender] = await ethers.getSigners();
  const amount = ethers.parseEther("2");
  const tx = await sender.sendTransaction({
    to: account,
    value: amount,
  });

  await tx.wait(1);
}
//helper function to get user current data
async function getuserinfo(account: any, pool: IPool) {
  const tx = await pool.getUserAccountData(account);
  console.log(tx);
}
export default simulation;
