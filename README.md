# VRV Смарт контракты


```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Verv.ts
```

## Версии контрактов на 11.04.2024

### VRV

- Name - `Verv-Beta`
- Symbol - `VRV`
- Decimals - `18`
- Зависимости - `ERC20`, `ERC20Burnable`, `Ownable`

Основные тезисы:
- Обычный `ERC20` контракт
- Основное отличие в том, что владелец чеканить может только для другого кошелька. 


### PrivateSell

- Name - `Verv-Private-Sell`
- Symbol - `VPRIVATE`
- Decimals - `0`
- Зависимости - `Ownable`, `EIP712`

Основные тезисы:
- Контракт `EIP712`
- Домен `EIP712` контракта - `VERVPRIVATESELL`. Версия - `1`
- Перед стартом продаж нужно инициализировать
- Принимает депозиты от пользователей
- Каждый депозит подписывается владельцем контракта
- 10 волн для депозитов
- Устанавливается лимит по количеству токенов на каждую из волн. Остаток не перетекает на следующую
- Есть несколько условий прекращения приема депозитов. 
  - Завершился прием по hardCap
  - Не достаточно лимита в текущей волне. Попробуйте купить меньше
- При условии набора hardCap прием депозитов завершается
- Добавляем метод, который завершает продажи, возвращает всем все либо переводит все бабки на баланс 
  кошелька который указан в методе


Как работать с контрактом

Пред началом продажи необходимо на баланс контракта Private Sell перечислить VRV токены в необходимом 
количестве. `При деплое через команду это происходит автоматически` 

```
vrvToken.transfer(privateSellContractAddress, 7_500_000_000_000_000_000_000_000n);
```

Пред началом продажи необходимо сконфигурировать контракт тем самым разрешив депозиты. `При деплое через команду это происходит автоматически`

```
// privateSellContract.openSell(softCap: bigint, hardCap: bigint, waveLimit: bigint);
privateSellContract.openSell(15_000_000_000_000_000_000n, 40_000_000_000_000_000_000n, 750_000_000_000_000_000_000_000n);
```


Чтобы совершить депозит, необходимо на бекенде подготовить данные которые затем можно добавить в транзакцию 
пользователя и вызвать отправку этой транзакции. 

```ts
import { ethers } from "hardhat";

type SolidityTypesAsString = "address"
        | "bytes" | "bytes1" | "bytes2" | "bytes3" | "bytes4" | "bytes5" | "bytes6" | "bytes7" | "bytes8" | "bytes9"
        | "bytes10" | "bytes11" | "bytes12" | "bytes13" | "bytes14" | "bytes15" | "bytes16" | "bytes17" | "bytes18" | "bytes19"
        | "bytes20" | "bytes21" | "bytes22" | "bytes23" | "bytes24" | "bytes25" | "bytes26" | "bytes27" | "bytes28" | "bytes29"
        | "bytes30" | "bytes31" | "bytes32"
        | "string"
        | "uint8"
        | "uint"
        | "uint256"

type EIP712TypeDefinition = {
  [key: string]: {
    name: string
    type: SolidityTypesAsString
  }[]
}

type EIP712Domain = {
  name: string
  version: string
  verifyingContract: string,
  chainId: number,
}

type HardhatSignerType = Awaited<Promise<PromiseLike<ReturnType<typeof ethers.getSigner>>>>


async function signTypedData(
    domain: EIP712Domain,
    types: EIP712TypeDefinition,
    values: Object,
    signer: HardhatSignerType
) {
  try {
    return await signer.signTypedData(domain, types, values)
  } catch (error) {
    console.log("[signTypedData]::error ",error )
    return ""
  }
}

const types: EIP712TypeDefinition = {
  DepositRequest: [
    { name: "to", type: "address" },
    { name: "tokenAmount", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "cost", type: "uint256" },
    { name: "wave", type: "uint8" }
  ]
};

const domain: EIP712Domain =  {
  name: "VERVPRIVATESELL",
  version: "1",
  chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId) as number, // ChainId лучше уточнить у Элькина в какой сети это будет расскатано 
  verifyingContract: privateSellContractAddress, // Адрес контракта приватной продажи
}

const deposit = {
  to: addr1.address, // Адресс пользователя
  tokenAmount: 1_000_000_000_000_000_000_000n, // Количество токенов VRV. (1000 токенов Ether)
  amount: 7_178_957_041_000_000, // Количество Eth. (0,007178957041 токенов Ether)
  cost: 7_178_957_041_000, // Курс за один VRV (Ether) (0,000007178957041)
  wave: 1 // Индекс волны
};

// Генерация подписи 
// owner - SignerWithAddress пользователь от имени которого расскатан контракт
const signature = await signTypedData(domain, types, deposit, owner);

// privateSellFactory - Фабрика в текущем примере из hardhad но можно и через ether вывать через
// new ethers.Contract(address, abi, owner);
const data = privateSellFactory.interface.encodeFunctionData("deposit", [{...deposit, signature}]);

// Данные готовы. Можно передавать на фронт для отправки пользователем

await addr1.sendTransaction({
  from: addr1.address,
  to: privateSellContractAddress,
  data: data,
  value: deposit.amount
})

```

