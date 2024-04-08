// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";
import "./IManager.sol";
import "./IManaged.sol";

abstract contract Managed is Context, IManaged {
    using Strings for uint256;
    using Time for *;

    address private _managerAddress;

    IManager private _managerContract;

    constructor(address managerAddress) {
        _changeManagerAddress(managerAddress);
    }

//    modifier restircted(bytes32[] acceptedRoles) {
//
//    }

    function _changeManagerAddress(address managerAddress) internal {
        if (managerAddress == address(0)) {
            revert AccessManagerInvalidAddress();
        }
        address oldAddress = _managerAddress;
        _managerAddress = managerAddress;

        _managerContract = IManager(_managerAddress);

        emit ChangeManageAddress(oldAddress, _managerAddress);
    }

    function getManager() external view returns (address) {
        return _managerAddress;
    }
}
