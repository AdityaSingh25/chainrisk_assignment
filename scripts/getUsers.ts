import { ethers } from "hardhat";
import runSimulation from "./newSim";
import { IPool } from "../typechain-types";
import mongoose, { mongo } from "mongoose";

//subgraph of aave-v3-core contracts
const SUBGRAPH_AAVEV3_MAINNET =
  "https://api.thegraph.com/subgraphs/name/aave/protocol-v3";

var valueEligibleForLiquidation = 0;
const userEligibleForLiquidation: any[] = [];
var valueRiskForLiquidation = 0;
const userRiskForLiquidation = [];

const userEligibleForLiquidationSchema = new mongoose.Schema({
  user: String,
});
const UserEligibleForLiquidation = mongoose.model("UserEligibleForLiquidation", userEligibleForLiquidationSchema);


async function main() {
  //pool contract with new pricefeed of WBTC
  const pool: IPool = await runSimulation();

  console.log("pool contract ", await pool.getAddress());

  await fetchusers(pool);
}

//this will fetch the users and if health factor is in risky zone , will update into the database
async function fetchusers(pool: IPool) {
  var count = 0;
  //process all the users who have borrwed anything
  //depending upon number of users use maxcount for demo purpose i have use 10
  var maxcount = 20;
  console.log();
  console.log(
    "fetching users who have borrowed in history............... query can be optimised"
  );

  while (count < maxcount) {
    console.log(`count ${count}`);

    try {
      const res = await fetch(SUBGRAPH_AAVEV3_MAINNET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query fetchUsers {
              users(
                first: 10
                skip:${10 * count}
                orderBy: id
                orderDirection: desc
                where: {borrowHistory_: {amount_gt: "0"}}
              ) {
                id
              }
            }
          `,
        }),
      });

      const temp = await res.json();
      await checkUserData(temp.data, pool);
    } catch (error) {
      console.log(error);
    }

    count++;
  }
}
// get the information about user and add into the database
async function checkUserData(load: any, pool: IPool) {
  for (const user of load.users) {
    const id = user.id;
    // Fetch pool contract data after simulation from scripts/getUserData.js
    const userData = await pool.getUserAccountData(id);

    let HF = userData.healthFactor;
    // check the correct format of HealthFactor . It should be in 18 decimal so just do HF/1e18
    if (HF < 1 * 1e18) {
      valueEligibleForLiquidation += Number(userData.totalCollateralBase);
      userEligibleForLiquidation.push(id);

      // liquidate the positions
    } else if (HF < 1.5 * 1e18) {
      valueRiskForLiquidation += Number(userData.totalCollateralBase);
      userRiskForLiquidation.push(id);
    }

    console.log(
      `${id} health factor is ${HF} and it has borrowed ${userData.totalCollateralBase} in base asset`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});