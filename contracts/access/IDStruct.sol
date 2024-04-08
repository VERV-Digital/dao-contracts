// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

struct IDData {
    uint256 tokenId;
    address owner;
    string firstName;
    string lastName;
    string[] citizenship;
    bool sex;
    string gender;
    string birthDate;
    string birthPlace;
    address issuer;
    uint expiresAt;
}

struct MintRequest {
    address owner;
    string firstName;
    string lastName;
    string[] citizenship;
    bool sex;
    string gender;
    string birthDate;
    string birthPlace;
    address issuer;
}
