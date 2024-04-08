// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IAccessErrors} from "./IAccessErrors.sol";

interface IManaged is IAccessErrors {

    event ChangeManageAddress(address oldAddress, address newAddress);

    function getManager() external view returns (string memory);
}
