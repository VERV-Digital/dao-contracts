// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IRoles} from "./IRoles.sol";
import {IID} from "./IID.sol";
import {IManager} from "./IManager.sol";

contract Manager is Ownable2Step, IManager {
    using Strings for uint256;

    address private _individualDocumentAddress;

    IID private _individualDocumentContract;

    constructor(address initialOwner) Ownable2Step(initialOwner) {}

    function setIndividualDocument(address _idAddress) public onlyOwner {
        if (_idAddress == address(0)) {
            revert ManagerInvalidAddress();
        }
        _individualDocumentAddress = _idAddress;

        _individualDocumentContract = IID(_individualDocumentAddress);
    }

    function getIndividualDocument() public view onlyOwner returns(string) {
        return _individualDocumentAddress;
    }

    function hasID(address userAddress) public view returns(bool) {
        _individualDocumentContract.
    }

    /*
Alien
○ У кошелька есть как минимум 1 токен ERC-721 RESPECT ИЛИ 1 токен ERC-721 vID
○ Адрес в NFT должен совпадать с пользователем
Resident
○ У кошелька есть минимум 1 токен ERC-721 TRUST ИЛИ 1 токен ERC-721 vID (Resident
Status)
○ Адрес NFT должен совпадать с пользователем
Citizen
○ У кошелька есть минимум 1 токен ERC-721 FAITH или 1 токен ERC-721 vID (Citizen
Status)
○ Адрес NFT должен совпадать с пользователем
PEN●
○ В vID указано, что кошелек является ассоциированным членом узла PEN
Commander
○ В vID указано, что кошелек имеет статус Node Commander у узла PEN
    */
}
