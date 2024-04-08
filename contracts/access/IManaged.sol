// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract IManaged {
    error AccessManagerInvalidAddress();

    event ChangeManageAddress(address oldAddress, address newAddress);

    function _changeManagerAddress(address managerAddress) internal;

    function getManager() public view returns(string);
}
