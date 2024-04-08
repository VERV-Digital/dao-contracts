// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IFaith} from "./IFaith.sol";

contract Faith is ERC721, IFaith {
    constructor(address initialAuthority)
        ERC721("VervFaith", "FAITH")
    {}

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }
}
