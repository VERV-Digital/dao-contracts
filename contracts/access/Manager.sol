// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Roles} from "./Roles.sol";
import {IID} from "./IID.sol";
import "./IDStruct.sol";
import {IManager} from "./IManager.sol";
import {IManaged} from "./IManaged.sol";

contract Manager is Ownable2Step, Roles, IManager {
    using Strings for uint256;

    address private _individualDocumentAddress;

    IID private _individualDocumentContract;

    constructor(address initialOwner) Ownable(initialOwner){}

    function setIndividualDocument(address _idAddress) public onlyOwner {
        if (_idAddress == address(0)) {
            revert AccessManagerInvalidAddress();
        }
        _individualDocumentAddress = _idAddress;

        _individualDocumentContract = IID(_individualDocumentAddress);
    }

    function getIndividualDocument() external view onlyOwner returns (address) {
        if (_individualDocumentAddress == address(0)) {
            revert AccessManagerContractAddressMissing();
        }

        return _individualDocumentAddress;
    }

    function hasID(address userAddress) external view returns(bool) {
        try _individualDocumentContract.getByOwner(userAddress) {
            return true;
        } catch {
            return false;
        }

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
