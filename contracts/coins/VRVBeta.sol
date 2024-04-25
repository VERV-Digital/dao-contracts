// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VRVBeta is ERC20, ERC20Burnable, Ownable2Step
{
    /**
     * @dev You can't mint for yourself
     */
    error VRVBetaInvalidSelfMinter();

    /**
     * @dev Rewards are not available after 21 days or you did not assign them
     */
    error VRVBetaRewardsNotAvailable();

    error VRVBetaRewardsSelf();

    uint public rewardsCloseAfter;

    mapping (address => uint256) private _rewards;

    constructor(uint256 initSupply, uint _rewardsAt)
        ERC20("VRV-Beta", "VRV")
        Ownable(_msgSender())
    {
        _mint(_msgSender(), initSupply);
        rewardsCloseAfter = _rewardsAt;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        if (to == _msgSender() || to == address(this)) {
            revert VRVBetaInvalidSelfMinter();
        }
        _mint(to, amount);
    }

    function addReward(address wallet, uint256 amount) external onlyOwner {
        _finishReward();

        if (wallet == _msgSender() || wallet == address(this)) {
            revert VRVBetaRewardsSelf();
        }

        _rewards[wallet] += amount;
    }

    function removeReward(address wallet) external onlyOwner {
        _finishReward();

        _rewards[wallet] = 0;
    }

    function hasReward() view external returns (uint256) {
        _finishReward();

        return _rewards[_msgSender()];
    }

    function claimReward() external {
        _finishReward();

        if (0 != _rewards[_msgSender()]) {
            _mint(_msgSender(), _rewards[_msgSender()]);

            _rewards[_msgSender()] = 0;
        } else {
            revert VRVBetaRewardsNotAvailable();
        }
    }

    function _finishReward() view private {
        if (block.timestamp >= rewardsCloseAfter) {
            revert VRVBetaRewardsNotAvailable();
        }
    }
}