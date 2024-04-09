import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";

const MAINNET_RPC_URL =
  "https://eth-mainnet.g.alchemy.com/v2/elRtANZLAowDJHz5beXIae4iVHeI6E4L";
const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        enabled: true,
        url: MAINNET_RPC_URL,
        blockNumber: 18589542,
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.6.6",
      },
    ],
  },
};

export default config;
