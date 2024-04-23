# VRV Смарт контракты

## Coverage

![Coverage](./docs/coverage.png)

## Gas

![Gas](./docs/gas.png)

## Команды

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/PrivateSale.ts --network localhost
```

## Описание контрактов (23.04.2024)

### VRV

- Name - `Verv-Beta`
- Symbol - `VRV`
- Decimals - `18`
- Зависимости - `ERC20`, `ERC20Burnable`, `Ownable`

Основные тезисы:
- Обычный `ERC20` контракт
- Основное отличие в том, что владелец чеканить может только для другого кошелька.
- Возможность назначать награды пользователям. Которые они получают сами. Под капотом происходит чеканка. Ограничить 
  по времени. Не востребованную награду можно удалить 


[//]: # (### PrivateSale)

[//]: # ()
[//]: # (- Name - `Verv-Private-Sale`)

[//]: # (- Symbol - `VPRIVATE`)

[//]: # (- Decimals - `0`)

[//]: # (- Зависимости - `Ownable`, `EIP712`)

[//]: # ()
[//]: # (Основные тезисы:)

[//]: # (- Контракт `EIP712`)

[//]: # (- Домен `EIP712` контракта - `VERVPRIVATESALE`. Версия - `1`)

[//]: # (- Перед стартом продаж нужно инициализировать)

[//]: # (- Принимает депозиты от пользователей)

[//]: # (- Каждый депозит подписывается владельцем контракта)

[//]: # (- 10 волн для депозитов)

[//]: # (- Устанавливается лимит по количеству токенов на каждую из волн. Остаток не перетекает на следующую)

[//]: # (- Есть несколько условий прекращения приема депозитов. )

[//]: # (  - Завершился прием по hardCap)

[//]: # (  - Не достаточно лимита в текущей волне. Попробуйте купить меньше)

[//]: # (- При условии набора hardCap прием депозитов завершается)

[//]: # (- Добавляем метод, который завершает продажи, возвращает всем все либо переводит все бабки на баланс )

[//]: # (  кошелька который указан в методе)

[//]: # ()
[//]: # ()
[//]: # (Как работать с контрактом)

[//]: # ()
[//]: # (Пред началом продажи необходимо на баланс контракта Private Sale перечислить VRV токены в необходимом )

[//]: # (количестве. `При деплое через команду это происходит автоматически` )

[//]: # ()
[//]: # (```)

[//]: # (vrvToken.transfer&#40;privateSaleContractAddress, 7_500_000_000_000_000_000_000_000n&#41;;)

[//]: # (```)

[//]: # ()
[//]: # (Пред началом продажи необходимо сконфигурировать контракт тем самым разрешив депозиты. `При деплое через команду это происходит автоматически`)

[//]: # ()
[//]: # (```)

[//]: # (// privateSaleContract.openSale&#40;softCap: bigint, hardCap: bigint, waveLimit: bigint&#41;;)

[//]: # (privateSaleContract.openSale&#40;15_000_000_000_000_000_000n, 40_000_000_000_000_000_000n, 750_000_000_000_000_000_000_000n&#41;;)

[//]: # (```)

[//]: # ()
[//]: # ()
[//]: # (Чтобы совершить депозит, необходимо на бекенде подготовить данные которые затем можно добавить в транзакцию )

[//]: # (пользователя и вызвать отправку этой транзакции. )

[//]: # ()
[//]: # (```ts)

[//]: # (import { ethers } from "hardhat";)

[//]: # ()
[//]: # (type SolidityTypesAsString = "address")

[//]: # (        | "bytes" | "bytes1" | "bytes2" | "bytes3" | "bytes4" | "bytes5" | "bytes6" | "bytes7" | "bytes8" | "bytes9")

[//]: # (        | "bytes10" | "bytes11" | "bytes12" | "bytes13" | "bytes14" | "bytes15" | "bytes16" | "bytes17" | "bytes18" | "bytes19")

[//]: # (        | "bytes20" | "bytes21" | "bytes22" | "bytes23" | "bytes24" | "bytes25" | "bytes26" | "bytes27" | "bytes28" | "bytes29")

[//]: # (        | "bytes30" | "bytes31" | "bytes32")

[//]: # (        | "string")

[//]: # (        | "uint8")

[//]: # (        | "uint")

[//]: # (        | "uint256")

[//]: # ()
[//]: # (type EIP712TypeDefinition = {)

[//]: # (  [key: string]: {)

[//]: # (    name: string)

[//]: # (    type: SolidityTypesAsString)

[//]: # (  }[])

[//]: # (})

[//]: # ()
[//]: # (type EIP712Domain = {)

[//]: # (  name: string)

[//]: # (  version: string)

[//]: # (  verifyingContract: string,)

[//]: # (  chainId: number,)

[//]: # (})

[//]: # ()
[//]: # (type HardhatSignerType = Awaited<Promise<PromiseLike<ReturnType<typeof ethers.getSigner>>>>)

[//]: # ()
[//]: # ()
[//]: # (async function signTypedData&#40;)

[//]: # (    domain: EIP712Domain,)

[//]: # (    types: EIP712TypeDefinition,)

[//]: # (    values: Object,)

[//]: # (    signer: HardhatSignerType)

[//]: # (&#41; {)

[//]: # (  try {)

[//]: # (    return await signer.signTypedData&#40;domain, types, values&#41;)

[//]: # (  } catch &#40;error&#41; {)

[//]: # (    console.log&#40;"[signTypedData]::error ",error &#41;)

[//]: # (    return "")

[//]: # (  })

[//]: # (})

[//]: # ()
[//]: # (const types: EIP712TypeDefinition = {)

[//]: # (  DepositRequest: [)

[//]: # (    { name: "to", type: "address" },)

[//]: # (    { name: "tokenAmount", type: "uint256" },)

[//]: # (    { name: "amount", type: "uint256" },)

[//]: # (    { name: "cost", type: "uint256" },)

[//]: # (    { name: "wave", type: "uint8" })

[//]: # (  ])

[//]: # (};)

[//]: # ()
[//]: # (const domain: EIP712Domain =  {)

[//]: # (  name: "VERVPRIVATESALE",)

[//]: # (  version: "1",)

[//]: # (  chainId: await ethers.provider.getNetwork&#40;&#41;.then&#40;&#40;{ chainId }&#41; => chainId&#41; as number, // ChainId лучше уточнить у Элькина в какой сети это будет расскатано )

[//]: # (  verifyingContract: privateSaleContractAddress, // Адрес контракта приватной продажи)

[//]: # (})

[//]: # ()
[//]: # (const deposit = {)

[//]: # (  to: addr1.address, // Адресс пользователя)

[//]: # (  tokenAmount: 1_000_000_000_000_000_000_000n, // Количество токенов VRV. &#40;1000 токенов Ether&#41;)

[//]: # (  amount: 7_178_957_041_000_000, // Количество Eth. &#40;0,007178957041 токенов Ether&#41;)

[//]: # (  cost: 7_178_957_041_000, // Курс за один VRV &#40;Ether&#41; &#40;0,000007178957041&#41;)

[//]: # (  wave: 1 // Индекс волны)

[//]: # (};)

[//]: # ()
[//]: # (// Генерация подписи )

[//]: # (// owner - SignerWithAddress пользователь от имени которого расскатан контракт)

[//]: # (const signature = await signTypedData&#40;domain, types, deposit, owner&#41;;)

[//]: # ()
[//]: # (// privateSaleFactory - Фабрика в текущем примере из hardhad но можно и через ether вывать через)

[//]: # (// new ethers.Contract&#40;address, abi, owner&#41;;)

[//]: # (const data = privateSaleFactory.interface.encodeFunctionData&#40;"deposit", [{...deposit, signature}]&#41;;)

[//]: # ()
[//]: # (// Данные готовы. Можно передавать на фронт для отправки пользователем)

[//]: # ()
[//]: # (await addr1.sendTransaction&#40;{)

[//]: # (  from: addr1.address,)

[//]: # (  to: privateSaleContractAddress,)

[//]: # (  data: data,)

[//]: # (  value: deposit.amount)

[//]: # (}&#41;)

[//]: # ()
[//]: # (```)

[//]: # ()
[//]: # (Для получения обновленной информации )

[//]: # ()
[//]: # (```ts)

[//]: # (// privateSaleContract.getStats&#40;wave: unit8&#41;;)

[//]: # ()
[//]: # (privateSaleContract.getStats&#40;1&#41;;)

[//]: # (```)

[//]: # (В ответ получаем информацию о волне)

[//]: # ()
[//]: # ()
[//]: # (Можно подписаться на события)

[//]: # ()
[//]: # (```solidity)

[//]: # ()
[//]: # (struct Deposit {)

[//]: # (  uint256 tokenAmount;)

[//]: # (  uint256 amount;)

[//]: # (  uint256 cost;)

[//]: # (  uint8 wave;)

[//]: # (  uint256 createdAt;)

[//]: # (  uint256 withdrawal;)

[//]: # (})

[//]: # ()
[//]: # (event Deposited&#40;address indexed from, Deposit _value&#41;; // Отправляется когда завершен депозит)

[//]: # (event SaleOpened&#40;&#41;; // Отправляется при открытии продаж)

[//]: # (event SaleClosed&#40;&#41;; // Отправляется при закрытии продаж)

[//]: # ()
[//]: # (```)

[//]: # (    )
[//]: # ()
[//]: # (Метод для получения баланса принятых депозитов в eth )

[//]: # (```solidity)

[//]: # (function getBalance&#40;&#41; public view returns &#40;uint256&#41;;)

[//]: # (```)

[//]: # ()
[//]: # (Метод для получения суммы депозитов)

[//]: # (```solidity)

[//]: # (function depositSum&#40;&#41; public view returns &#40;uint256&#41;;)

[//]: # (```)
