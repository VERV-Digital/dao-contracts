// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "./../library/DateTimeLibrary.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC165, ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import "hardhat/console.sol";
import "../access/IID.sol";
import {Managed} from "../access/Managed.sol";


contract VervID is Context, ERC165, IERC721, IERC721Enumerable, IERC721Metadata, IERC721Errors, IID {
    using Strings for uint256;

    uint private _expiredAt = 360 days;

    /**
     * @dev 
     */
    event Mint(address indexed from, address indexed owner, uint256 indexed tokenId);

    /**
     * @dev 
     */
    event Burn(address indexed from, address indexed owner);

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // Data base vIDs
    mapping(address => IDData) private _data;

    mapping(uint256 tokenId => address) private _owners;

    uint256[] private _allTokens;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor() {
        _name = "VervID";
        _symbol = "vID";
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721Enumerable).interfaceId ||
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }
   
    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) public view virtual returns (uint256) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(address(0));
        }

        if(_data[owner].owner == owner) {
            return 1;
        }

        return 0;
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        address owner = _owners[tokenId];

        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }

        return owner;
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public pure {
        revert VervIDNOTransfer();
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual {
        revert VervIDNOTransfer();
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(address from, address to, uint256 tokenId) public virtual {
        revert VervIDNOTransfer();
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) public virtual {
        revert VervIDNOTransfer();
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view virtual returns (address) {
        revert VervIDNOTransfer();
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public virtual {
        revert VervIDNOTransfer();
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) public view virtual returns (bool) {
        revert VervIDNOTransfer();
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        // address owner = _owners[tokenId];

        // if (owner == address(0)) {
        //     revert ERC721NonexistentToken(tokenId);
        // }
        // // @TDDO: Добавить сюда проверку на роли
        // IDData memory data = _data[owner];

        // string memory citizenship = "";

        // for (uint i=0; i < data.citizenship.length; i++) {
        //     if (i == 0) {
        //         citizenship = data.citizenship[i];
        //     } else {
        //         citizenship = _concatenateStrings(citizenship, data.citizenship[i], " ,");
        //     }
        // }

        // console.log(data.owner);
        // console.log(citizenship);
        // console.log(
        //     keccak256(
        //         abi.encodePacked(
        //             data.owner,
        //             data.firstName,
        //             data.lastName,
        //             citizenship,
        //             data.sex,
        //             data.gender,
        //             data.birthDate,
        //             data.birthPlace,
        //             data.issuer,
        //             data.expiresAt
        //         )
        //     )
        // );

        // return _bytes32ToString(
        //     keccak256(
        //         abi.encodePacked(
        //             data.owner,
        //             data.firstName,
        //             data.lastName,
        //             citizenship,
        //             data.sex,
        //             data.gender,
        //             data.birthDate,
        //             data.birthPlace,
        //             data.issuer,
        //             data.expiresAt
        //         )
        //     )
        // );
    }

    function getByTokenId(uint256 tokenId) public view virtual returns (IDData memory) {
        address owner = _owners[tokenId];

        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }

        if (balanceOf(owner) < 1) {
            revert VervIDNotExist();
        }
        // @TDDO: Добавить сюда проверку на роли

        return _data[owner];
    }


    function getByOwner(address owner) public view virtual returns (IDData memory) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(owner);
        }
        
        if (balanceOf(owner) < 1) {
            revert VervIDNotExist();
        }

        // @TDDO: Добавить сюда проверку на роли

        return _data[owner];
    }


    function getMe() public view virtual returns (IDData memory) {
        if (_msgSender() == address(0)) {
            revert ERC721InvalidOwner(_msgSender());
        }
        
        if (balanceOf(_msgSender()) < 1) {
            revert VervIDNotExist();
        }

        // @TDDO: Добавить сюда проверку на роли

        return _data[_msgSender()];
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256) {
        if (index >= balanceOf(owner)) {
            revert ERC721OutOfBoundsIndex(owner, index);
        }

        return _data[owner].tokenId;
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _allTokens.length;
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view virtual returns (uint256) {
        if (index >= totalSupply()) {
            revert ERC721OutOfBoundsIndex(address(0), index);
        }

        return _allTokens[index];
    }


    function mint(MintRequest memory request) public {
        if (request.owner == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }

        if (request.issuer == address(0)) {
            revert ERC721InvalidSender(address(0));
        }

        if (balanceOf(request.owner) >= 1) {
            revert VervIDExist();
        }
        // @TDDO: Добавить сюда проверку на роли
        
        uint256 tokenId = _allTokens.length + 1;

        uint256 expiredAt = block.timestamp + _expiredAt;

        _data[request.owner] = IDData(
            tokenId,
            request.owner,
            request.firstName,
            request.lastName,
            request.citizenship,
            request.sex,
            request.gender,
            request.birthDate,
            request.birthPlace,
            request.issuer,
            expiredAt
        );

        _owners[tokenId] = request.owner;

        _allTokens.push(tokenId);

        emit Mint(_msgSender(), request.owner, tokenId);
    }

    function burn(uint256 tokenId) public virtual {

        // @TDDO: Добавить сюда проверку на роли
    }

    function isExpired(uint256 tokenId) public view returns (bool) {

        // @TDDO: Добавить сюда проверку на роли
    }

    /**
     * @dev Transform bytes32 to string
     */
    function _bytes32ToString(bytes32 bufer) internal pure returns (string memory) {
        return string(abi.encodePacked(bufer));
    }

    function _concatenateStrings(string memory a, string memory b, string memory delimeter) public pure returns (string memory) {
        bytes memory concatenatedBytes = abi.encodePacked(a, delimeter, b);

        return string(concatenatedBytes);
    }
}

