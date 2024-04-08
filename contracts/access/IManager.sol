// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IManager {
    function setIndividualDocument(address _idAddress) public;

    function getIndividualDocument() public view returns(string);
}
