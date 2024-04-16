// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./coins/VRVBeta.sol";
import "hardhat/console.sol";

contract PrivateSale is EIP712, Ownable {

    using Math for uint256;
    using Address for address;

    string private constant SIGNING_DOMAIN = "VERVPRIVATESALE";
    string private constant SIGNATURE_VERSION = "1";

    error PrivateSaleSaleIsOpen();
    error PrivateSaleSaleIsFinish();
    error PrivateSaleDepositExpired();
    error PrivateSaleFailedWaveIndex();
    error PrivateSaleFailedSender();
    error PrivateSaleFailedSignature(address signer);
    error PrivateSaleWaveLimitExceeded(uint256 limit);
    error PrivateSaleInsufficientBalance();

    event Deposited(address indexed from, Deposit _value);

    event SaleOpened();
    event SaleClosed();

    struct Deposit {
        uint256 tokenAmount;
        uint256 amount;
        uint256 cost;
        uint8 wave;
        uint256 createdAt;
        uint256 withdrawal;
    }

    struct DepositRequest {
        address to;
        uint256 tokenAmount;
        uint256 amount;
        uint256 cost;
        uint8 wave;
        uint256 expireTo;
        bytes signature;
    }

    struct WaveInfo {
        uint8 index;
        uint256 limit;
        uint256 deposit;
        uint256 depositToken;
        uint depositCount;
    }

    uint256 private _depositSum;

    uint256 private _softCap;
    uint256 private _hardCap;

    VRVBeta private _token;

    mapping(address => Deposit[]) private _deposits;

    mapping(uint8 => WaveInfo) private _waveInfo;

    bool private _openSale;

    bool private _finishSale;

    bool private _success;

    bool private _failed;

    function depositSum() public view returns (uint256) {
        return _depositSum;
    }

    constructor(address vrvToken)
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
        Ownable(_msgSender())
    {
        _token = VRVBeta(vrvToken);
        _openSale = false;
        _finishSale = false;
        _failed = false;
        _success = false;
    }

    function openSale(
        uint256 softCap,
        uint256 hardCap,
        uint256 waveLimit
    ) external onlyOwner {
        if (_openSale == true) {
            revert PrivateSaleSaleIsOpen();
        }

        _softCap = softCap;
        _hardCap = hardCap;

        for (uint8 i = 0; i < 10; i++) {
            _waveInfo[i] = WaveInfo(
                i, waveLimit, 0, 0, 0
            );
        }

        _openSale = true;
    }

    function deposit(DepositRequest calldata request) payable public {
        if (_finishSale) {
            revert PrivateSaleSaleIsFinish();
        }

        address signer = _verifyDepositRequest(request);

        if (owner() != signer) {
            revert PrivateSaleFailedSignature(signer);
        }

        if (request.wave >= 10) {
            revert PrivateSaleFailedWaveIndex();
        }

        if (request.to != _msgSender()) {
            revert PrivateSaleFailedSender();
        }

        if (request.expireTo <= block.timestamp) {
            revert PrivateSaleDepositExpired();
        }

        if (_waveInfo[request.wave].limit < request.tokenAmount) {
            revert PrivateSaleWaveLimitExceeded(_waveInfo[request.wave].limit);
        }

        if (msg.value < request.amount) {
            revert PrivateSaleInsufficientBalance();
        }

        Deposit memory dep = Deposit(
            request.tokenAmount,
            request.amount,
            request.cost,
            request.wave,
            block.timestamp,
            0
        );

        _deposits[_msgSender()].push(dep);

        _waveInfo[request.wave].deposit += request.amount;
        _waveInfo[request.wave].depositToken += request.tokenAmount;
        _waveInfo[request.wave].depositCount++;
        _waveInfo[request.wave].limit -= request.tokenAmount;

        _depositSum += request.tokenAmount;

        emit Deposited(_msgSender(), dep);
    }

    function commit(address payable transferTo, uint256 amount) public onlyOwner {
        _calc();
        if (_success) {
            transferTo.transfer(amount);
        }
    }

    function rollback() public onlyOwner {
        _calc();
        if (_finishSale && _failed) {
//            TODO
        }
    }

    function _calc() internal {
        if (_depositSum < _softCap) {
            _failed = true;
        }
        if (_depositSum >= _softCap) {
            _failed = false;
            _success = true;
        }

        if (_depositSum >= _hardCap) {
            _finishSale = true;
        }
    }

    function _verifyDepositRequest(DepositRequest calldata request) internal view returns (address) {
        bytes32 digest = _hashDepositRequest(request);

        return ECDSA.recover(digest, request.signature);
    }

    function _hashDepositRequest(DepositRequest calldata request) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
        keccak256("DepositRequest(address to,uint256 tokenAmount,uint256 amount,uint256 cost,uint8 wave,uint256 expireTo)"),
                    request.to,
                    request.tokenAmount,
                    request.amount,
                    request.cost,
                    request.wave,
                    request.expireTo
                )
            )
        );
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getStats(uint8 wave) public view returns (WaveInfo memory) {
        if (wave >= 10) {
            revert PrivateSaleFailedWaveIndex();
        }

        return _waveInfo[wave];
    }

    /**
    * @notice Returns the chain id of the current blockchain.
    * @dev This is used to workaround an issue with ganache returning different values from the on-chain chainid() function and
    *  the eth_chainId RPC method. See https://github.com/protocol/nft-website/issues/121 for context.
    */
    function getChainID() external view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}