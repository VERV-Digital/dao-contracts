// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IID {

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


    /**
     * @dev Verv ID cannot be shared with anyone
     */
    error VervIDNOTransfer();

    /**
     * @dev Verv ID Exits
     */
    error VervIDExist();

    /**
     * @dev Verv ID Not Exits
     */
    error VervIDNotExist();

    /**
     * @dev An `owner`'s token query was out of bounds for `index`.
     *
     * NOTE: The owner being `address(0)` indicates a global out of bounds index.
     */
    error ERC721OutOfBoundsIndex(address owner, uint256 index);

}
