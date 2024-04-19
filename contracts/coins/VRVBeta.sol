// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VRVBeta is ERC20, ERC20Burnable, Ownable
{
    /**
     * @dev You can't mint for yourself
     */
    error VRVBetaInvalidSelfMinter();

    /**
     * @dev Rewards are not available after 21 days or you did not assign them
     */
    error VRVBetaRewardsNotAvailable();

    uint public rewardsCloseAfter;

    mapping (address => uint256) private _rewards;

    constructor(uint256 initSupply, uint _rewardsAt)
        ERC20("VRV-Beta", "VRV")
        Ownable(_msgSender())
    {
        _mint(_msgSender(), initSupply);
        rewardsCloseAfter = _rewardsAt;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        if (to == _msgSender()) {
            revert VRVBetaInvalidSelfMinter();
        }
        _mint(to, amount);
    }

    function addReward(address wallet, uint256 amount) external onlyOwner {
        _finishReward();

        _rewards[wallet] += amount;
    }

    function removeReward(address wallet) external onlyOwner {
        _finishReward();

        _rewards[wallet] = 0;
    }

    function claimReward() external {
        _finishReward();

        if (_rewards[_msgSender()] > 0) {
            _mint(_msgSender(), _rewards[_msgSender()]);

            _rewards[_msgSender()] = 0;
        } else {
            revert VRVBetaRewardsNotAvailable();
        }
    }

    function _finishReward() view internal {
        if (block.timestamp >= rewardsCloseAfter) {
            revert VRVBetaRewardsNotAvailable();
        }
    }
}