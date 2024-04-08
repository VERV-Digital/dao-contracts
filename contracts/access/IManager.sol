// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./IAccessErrors.sol";

interface IManager is IAccessErrors {
    function setIndividualDocument(address _idAddress) external;

    function getIndividualDocument() external view returns(address);
}
