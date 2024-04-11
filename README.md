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
- Decimals - `4`
- Зависимости - `ERC20`, `ERC20Burnable`, `Ownable`

Основные тезисы:
- Обычный `ERC20` контракт
- Основное отличие в том, что владелец чеканить может только для другого кошелька. 

