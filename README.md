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
- Основное отличие в том, что владелец чеканить может только для другого кошелька.
- Возможность назначать награды пользователям. Которые они получают сами. Под капотом происходит чеканка. Ограничить 
  по времени. Не востребованную награду можно удалить 

