# VRV Смарт контракты

## Coverage

![Coverage](./docs/coverage.png)

## Gas

![Gas](./docs/gas.png)

## Команды

### Запуск тестов

```shell
npx hardhat test
```

### Запуск тестов (с расчетом расхода газа)

```shell
REPORT_GAS=true npx hardhat test
```

### Запуск локальной ноды

```shell
npx hardhat node
```

### Деплой на локальный контур (только VRV контракт)

После запуска локальной ноды

```shell
npx hardhat ignition deploy ./ignition/modules/OnlyVervCoin.ts --network localhost
```

## Описание контрактов (23.04.2024)

### VRV

- Name - `Verv-Beta`
- Symbol - `VRV`
- Decimals - `18`
- Зависимости - `ERC20`, `ERC20Burnable`, `Ownable`

Основные тезисы:
- Обычный `ERC20` контракт
- Основное отличие в том, что владелец может чеканить может только для другого кошелька.
- Возможность назначать награды пользователям. Которые они получают сами. Под капотом происходит чеканка. Ограничить 
  по времени. Не востребованную награду можно удалить 

### PrivateSale

- Зависимости - `Ownable`, `EIP712`

Основные тезисы:
- Контракт `EIP712`
- Домен `EIP712` контракта - `VERVPRIVATESALE`. Версия - `1`
- Перед стартом продаж нужно инициализировать
- Принимает ставки от пользователей
- Принимает депозиты от пользователей
- Каждая ставка подписывается владельцем контракта
- Каждый депозит подписывается владельцем контракта
- 10 волн для ставок/депозитов
- Устанавливается лимит по количеству токенов на каждую из волн. Остаток не перетекает на следующую
- Есть режим продажи после всех волн. Куда все оставшиеся лимиты сливаются
- Перед депозитом нужно сделать ставку
- Можно отправить депозит минуя ставку
- Есть несколько условий прекращения приема депозитов.
  - Завершился прием по hardCap
  - Не достаточно лимита в текущей волне. Попробуйте купить меньше
- При условии набора hardCap прием депозитов завершается
- Есть Дата после которой продажи автоматически завершаются
- Добавляем метод, который возвращает всем если не набрали softCap или переводит все на указанный адрес в случае 
  набора softCap
- Деньги за ставки не возвращаем

## Взаимодействие с контрактами

### VRV

Есть все методы ERC20
[https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC20)

Помимо этих методов есть другие методы

#### Deploy

```solidity
  // initSupply - Чеканим сразу количество токенов
  // _rewardsAt - Дата после которой нельзя взаимодействовать в методами наград
  constructor(uint256 initSupply, uint _rewardsAt);
```

#### Чеканка

```solidity

  // Отчеканить для адреса количество токенов. Только владелец контракта
  function mint(address to, uint256 amount) public onlyOwner;
```

#### Награды

```solidity

  // Разрешить wallet отчеканить amount токенов. Только владелец контракта
  function addReward(address wallet, uint256 amount) external onlyOwner;

  // Удалить разрешение wallet отчеканить. Только владелец контракта
  function removeReward(address wallet) external onlyOwner;

  // Проверить сколько награды доступно
  function hasReward() view external returns (uint256);
  
  // Получить доступную награду
  function claimReward() external;
```
 
### Private Sell

Контракт соблюдает [EIP712](https://docs.openzeppelin.com/contracts/5.x/api/utils#EIP712)

```solidity
  string private constant SIGNING_DOMAIN = "VERVPRIVATESALE";
  string private constant SIGNATURE_VERSION = "1";
```

#### Ошибки

```solidity
  error PrivateSaleOpened(); // Продажа открыта
  error PrivateSaleClosed(); // Продажа закрыта
  error PrivateSaleDepositBidNotFound(); // Ставка не найдена
  error PrivateSaleDepositBidExist(); // Ставка уже существует
  error PrivateSaleDepositExpired(); // Время на выполнение транзакции депозита истекло
  error PrivateSaleDepositFailedTokenAmount(); // Количество токенов в депозите превышает заявленное в ставке
  error PrivateSaleFailedWaveIndex(); // Не верный индекс волны
  error PrivateSaleFailedSender(); // Не верный отправитель транзакции
  error PrivateSaleFailedSignature(address signer); // Транзакцию подписал не владелец контракта
  error PrivateSaleWaveLimitExceeded(uint256 limit); // Не достаточно лимита токенов в волне
  error PrivateSaleInsufficientBalance(); // Отправлено не достаточное количество ETH
  error PrivateSaleAfterWaveNotRegistered(); // Режим AfterWave не включен
  error PrivateSaleAfterWaveRegistered(); // Режим AfterWave уже включен
```

#### Структуры

```solidity

  struct Deposit {
    address payable to; // Адрес пользователя
    uint256 tokenAmount; // Сколько он хочет выкупить токенов  (wei)
    uint256 amount; // Сколько он потратит eth (tokenAmount * cost)  (wei)
    uint256 cost; // Сколько он готов предложить за 1 VRV (wei)
    uint256 requestValue; // Сколько он отправляет при создании депозита (amount * 0,9) (wei)
    uint8 wave; // Индекс волны (0-9) (10 в случае afterWave)
    uint256 createdAt; // Время создания депозита
    bool notBid; // Флаг большого депозита, когда нужно выкупить без ставки
    uint256 withdrawal; // Сумма возврата в случае не набранного softCap
  }

  struct DepositRequest {
    address to; // Адрес пользователя
    uint256 tokenAmount; // Сколько он хочет выкупить токенов  (wei)
    uint256 amount; // Сколько он потратит eth (tokenAmount * cost)  (wei)
    uint256 cost; // Сколько он готов предложить за 1 VRV (wei)
    uint256 requestValue; // Сколько он отправляет при создании депозита (amount * 0,9) (wei)
    uint8 wave; // Индекс волны (0-9) (10 в случае afterWave)
    uint256 expireTo; // Время после которого депозит не будет принят
    bool notBid; // Флаг большого депозита, когда нужно выкупить без ставки
    bytes signature; // Подпись владельца контракта
  }

  struct Bid {
    address to; // Адрес пользователя
    uint256 tokenAmount; // Сколько он хочет выкупить токенов  (wei)
    uint256 amount; // Сколько он потратит eth (tokenAmount * cost)  (wei)
    uint256 cost; // Сколько он готов предложить за 1 VRV (wei)
    uint256 requestValue; // Сколько он отправляет при создании ставки (amount * 0,1) (wei)
    uint8 wave; // Индекс волны (0-9)
    uint256 createdAt; // Время создания ставки
  }

  struct BidRequest {
    address to; // Адрес пользователя
    uint256 tokenAmount; // Сколько он хочет выкупить токенов  (wei)
    uint256 amount; // Сколько он потратит eth (tokenAmount * cost)  (wei)
    uint256 cost; // Сколько он готов предложить за 1 VRV (wei)
    uint256 requestValue; // Сколько он отправляет при создании ставки (amount * 0,1) (wei)
    uint8 wave; // Индекс волны (0-9)
    bytes signature; // Подпись владельца контракта
  }

  struct WaveInfo {
    uint8 index; // Индекс волны
    uint256 limit; // Оставшийся лимит токенов в волне, сколько не выкупленных (задепозиченных)
    uint256 bid; // Сумма EHT потраченных на ставки
    uint256 bidToken; // Сумма токенов на которые сделаны ставки
    uint256 deposit; // Сумма ETH потраченных на депозиты (без ставок)
    uint256 depositToken; // Сумма токенов на которые сделаны депозиты
    uint depositCount; // Количество депозитов
    uint bidCount; // Количество ставок
  }

  enum LogAction {
    Bid,  // 0 - Ставка
    Deposit, // 1 - Депозит, noBid = false
    BigDeposit // 2 - Депозит, noBid = true
  }

  struct Log {
    address to; // Кто сделал
    LogAction action; // Какое действие
    uint256 amount; // Сколько в ETH
    uint256 tokenAmount; // Сколько токенов VRV
    uint256 cost; // Какой курс
    uint8 wave; // Индекс волны
    uint256 createdAt; // Дата
  }
```

#### События

```solidity
  event Bet(address indexed from, Bid _value); // События успешно созданной ставки
  event Deposited(address indexed from, Deposit _value); // Событие успешно созданного депозита

  event SaleOpened(); // Событие после открытия продаж
  event SaleClosed(); // Событие после закрытия продаж
```

#### Публичные поля

```solidity
  bool public opened; // Флаг открытия продаж (после инициализации всегда true)
  bool public closed; // Флаг закрытия продаж
  uint256 public closeAt; // Время автоматического закрытия продаж
```

#### Deploy

```solidity
  // Адрес VRV токена
  constructor(address vrvToken)
```

#### Открытие продаж

Пред началом продажи необходимо на баланс контракта Private Sale перечислить VRV токены в необходимом количестве. При деплое через команду это происходит автоматически

```ts
vrvToken.transfer(privateSaleContractAddress, 7_500_000_000_000_000_000_000_000n);
```

Пред началом продажи необходимо сконфигурировать контракт тем самым разрешив депозиты. При деплое через команду это происходит автоматически

```solidity

  function openSale(
    uint256 softCap, // по умолчанию 15_000_000_000_000_000_000n
    uint256 hardCap, // по умолчанию 40_000_000_000_000_000_000n
    uint8 waveCount, // по умолчанию 10
    uint256 waveLimit, // по умолчанию 750_000_000_000_000_000_000_000n
    uint _closeAt // Определится позже
  ) external onlyOwner;
```

#### Ставка

Чтобы совершить ставку, необходимо на бекенде подготовить данные которые затем можно добавить в транзакцию 
пользователя и вызвать отправку этой транзакции.

```ts
import { ethers } from "hardhat";
import {EIP712Domain, EIP712TypeDefinition} from "../helpers/EIP712.types";

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
  verifyingContract: privateSaleContractAddress, // Адрес контракта приватной продажи
}

const bid = {
  to: address.address, // Адресс пользователя
  tokenAmount: 1000000000000000000000n, // Количество токенов VRV. (1000 токенов Ether)
  amount: 7178957041000000n, // Количество Eth. (0,007178957041 токенов Ether)
  cost: 7178957041000n, // Курс за один VRV (Ether) (0,000007178957041)
  requestValue: 717895704100000n, // 0.1 от amount
  wave: wave // Индекс волны
};

// Генерация подписи 
// owner - SignerWithAddress пользователь от имени которого расскатан контракт
const signature = await signTypedData(domain, types, bid, owner);

// privateSaleFactory - Фабрика в текущем примере из hardhad но можно и через ether вывать через
// new ethers.Contract(address, abi, owner);
const data = privateSaleFactory.interface.encodeFunctionData("bid", [{...bid, signature}]);

// Данные готовы. Можно передавать на фронт для отправки пользователем
await addr1.sendTransaction({
  from: addr1.address,
  to: privateSaleContractAddress,
  data: data,
  value: bid.requestValue
})
```

#### Депозит

Чтобы совершить ставку, необходимо на бекенде подготовить данные которые затем можно добавить в транзакцию 
пользователя и вызвать отправку этой транзакции.

```ts
import { ethers } from "hardhat";
import {EIP712Domain, EIP712TypeDefinition} from "../helpers/EIP712.types";

const types: EIP712TypeDefinition = {
  DepositRequest: [
    {name: "to", type: "address"},
    {name: "tokenAmount", type: "uint256"},
    {name: "amount", type: "uint256"},
    {name: "cost", type: "uint256"},
    {name: "requestValue", type: "uint256"},
    {name: "wave", type: "uint8"},
    {name: "expireTo", type: "uint256"},
    {name: "notBid", type: "bool"}
  ]
};

const domain: EIP712Domain =  {
  name: "VERVPRIVATESALE",
  version: "1",
  chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId) as number, // ChainId лучше уточнить у Элькина в какой сети это будет расскатано 
  verifyingContract: privateSaleContractAddress, // Адрес контракта приватной продажи
}

const dep = {
  to: address.address, // Адресс пользователя
  tokenAmount: 1000000000000000000000n, // Количество токенов VRV. (1000 токенов Ether)
  amount: 7178957041000000n, // Количество Eth. (0,007178957041 токенов Ether)
  cost: 7178957041000n, // Курс за один VRV (Ether) (0,000007178957041)
  requestValue: 6461061336900000, // 0.9 от amount
  wave: wave, // Индекс волны (для afterWave - 10)
  expireTo: currentTime + 3600, // Время после которого депозит не будет принят
  notBid: notBid // Флаг большого депозита, когда нужно выкупить без ставки (для больших ставок true)
};

// Генерация подписи 
// owner - SignerWithAddress пользователь от имени которого расскатан контракт
const signature = await signTypedData(domain, types, dep, owner);

// privateSaleFactory - Фабрика в текущем примере из hardhad но можно и через ether вывать через
// new ethers.Contract(address, abi, owner);
const data = privateSaleFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);

// Данные готовы. Можно передавать на фронт для отправки пользователем
await addr1.sendTransaction({
  from: addr1.address,
  to: privateSaleContractAddress,
  data: data,
  value: dep.requestValue
})
```


#### Информация о волне

```solidity

  function getWaveInfo(uint8 waveIndex) public view returns (WaveInfo memory);
```

TODO: Другие методы можно посмотреть в контракте