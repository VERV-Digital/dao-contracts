// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./IDStruct.sol";

interface IID {

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

    function getByTokenId(uint256 tokenId) external view returns (IDData memory);

    function getByOwner(address owner) external view returns (IDData memory);

    function getMe() external view returns (IDData memory);

}
