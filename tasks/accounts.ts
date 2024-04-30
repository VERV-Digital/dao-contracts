import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (_, { ethers }) => {
    const accounts = await ethers.getSigners();
    const provider = ethers.provider;

    for (const account of accounts) {
        const balance = await provider.getBalance(account);

        console.log(account.address, ethers.formatEther(balance), "ETH");
    }
});