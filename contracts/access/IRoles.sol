// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IRoles {
    bytes32 public constant ALIEN_ROLE = keccak256("ALIEN_ROLE");

    bytes32 public constant RESIDENT_ROLE = keccak256("RESIDENT_ROLE");

    bytes32 public constant CITIZEN_ROLE = keccak256("CITIZEN_ROLE");

    bytes32 public constant PEN_ROLE = keccak256("PEN_ROLE");

    bytes32 public constant COMMANDER_ROLE = keccak256("COMMANDER_ROLE");
}
