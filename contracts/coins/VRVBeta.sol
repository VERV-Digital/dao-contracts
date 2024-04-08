// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract VRVBeta is ERC20, ERC20Burnable {

    constructor(uint256 initSupply)
        ERC20("VRV-Beta", "VRV")
    {
        _mint(_msgSender(), initSupply);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
