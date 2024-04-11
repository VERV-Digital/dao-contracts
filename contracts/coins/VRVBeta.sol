// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VRVBeta is ERC20, ERC20Burnable, Ownable {

    /**
     * @dev You can't mint for yourself
     */
    error VRVBetaInvalidSelfMinter();

    constructor(uint256 initSupply)
        ERC20("VRV-Beta", "VRV")
        Ownable(_msgSender())
    {
        _mint(_msgSender(), initSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        if (to == _msgSender()) {
            revert VRVBetaInvalidSelfMinter();
        }
        _mint(to, amount);
    }
}