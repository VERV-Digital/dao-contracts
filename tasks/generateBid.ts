import { task } from "hardhat/config";
import {address} from "hardhat/internal/core/config/config-validation";
import {decimalString} from "hardhat/src/internal/core/config/config-validation";
import {signTypedData} from "../helpers/EIP712";
import {EIP712Domain, EIP712TypeDefinition} from "../helpers/EIP712.types";
import {PrivateSale} from "../typechain-types";

task("generate-bid", "Generate hash bid")
    .addParam("contract", "Contract address")
    .addParam("to", "User wallet address")
    .addOptionalParam("ownerPrivateKey", "Custom private key")
    .addParam("tokenAmount", "Token Amount", "1000000000000000000000")
    .addParam("cost", "Cost", "7178957041000")
    .addParam("wave", "Wave", "0")
    .setAction(async (taskArgs, { ethers, artifacts }) => {
        const contractArtifact = await artifacts.readArtifact("PrivateSale");

        const types:  EIP712TypeDefinition = {
            BidRequest: [
                {name: "to", type: "address"},
                {name: "tokenAmount", type: "uint256"},
                {name: "amount", type: "uint256"},
                {name: "cost", type: "uint256"},
                {name: "requestValue", type: "uint256"},
                {name: "wave", type: "uint8"},
            ]
        };

        const domain: EIP712Domain =  {
            name: "VERVPRIVATESALE",
            version: "1",
            chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId) as number, // ChainId лучше уточнить у Элькина в какой сети это будет расскатано
            verifyingContract: taskArgs.contract, // Адрес контракта приватной продажи
        }

        const amount = BigInt(parseFloat(ethers.formatEther(BigInt(taskArgs.tokenAmount))) * taskArgs.cost);

        const bid = {
            to: taskArgs.to,
            tokenAmount: BigInt(taskArgs.tokenAmount),
            amount: amount,
            cost: BigInt(taskArgs.cost),
            requestValue: amount / BigInt(10),
            // wave: BigInt(taskArgs.wave)
            wave: 100
        };

        if (taskArgs.ownerPrivateKey) {

        }

        const owner = (await ethers.getSigners())[0];

        console.log("Owner:", owner.address);
        console.log("Domain:\n", domain);

        console.log("Bid:\n", bid);

        const signature = await signTypedData(domain, types, bid, owner);

        console.log("Signature:\n", signature);


        let contract = new ethers.Contract(taskArgs.contract, contractArtifact.abi, owner);
        // contract = contract.attach(taskArgs.contract).connect(owner);

        const data = contract.interface.encodeFunctionData("bid", [{...bid, signature}]);

        console.log("Tx Request:\n", [
            bid.to,
            bid.tokenAmount.toString(),
            bid.amount.toString(),
            bid.cost.toString(),
            bid.requestValue.toString(),
            bid.wave.toString(),
            signature
        ]);


        console.log("Data:\n", data);

        console.log("Transaction Data:\n", {
            to: taskArgs.contract,
            data: data,
            value: bid.requestValue
        });
        // console.log(await contract.getTokenBalance());
        const tx = await owner.sendTransaction({
            to: taskArgs.contract,
            data: data,
            value: bid.requestValue,
            nonce: (await owner.getNonce())
        })

        console.log(tx);
        const receipt= await tx.wait();

        console.log(receipt, await receipt?.confirmations());
        console.log(await contract.getAddress());
    });