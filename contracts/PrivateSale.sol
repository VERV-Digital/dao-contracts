// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {VRVBeta} from "./coins/VRVBeta.sol";

contract PrivateSale is EIP712, Ownable2Step {

    using Math for uint256;
    using Address for address;

    string private constant SIGNING_DOMAIN = "VERVPRIVATESALE";
    string private constant SIGNATURE_VERSION = "1";

    address private constant NULL_ADDRESS = address(0);

    error PrivateSaleOpened();
    error PrivateSaleClosed();
    error PrivateSaleDepositBidNotFound();
    error PrivateSaleDepositBidExist();
    error PrivateSaleDepositExpired();
    error PrivateSaleDepositFailedTokenAmount();
    error PrivateSaleFailedWaveIndex();
    error PrivateSaleFailedSender();
    error PrivateSaleFailedSignature(address signer);
    error PrivateSaleWaveLimitExceeded(uint256 limit);
    error PrivateSaleInsufficientBalance();
    error PrivateSaleAfterWaveNotRegistered();
    error PrivateSaleAfterWaveRegistered();

    struct Deposit {
        address payable to;
        uint256 tokenAmount;
        uint256 amount;
        uint256 cost;
        uint256 requestValue;
        uint8 wave;
        uint256 createdAt;
        bool notBid;
        uint256 withdrawal;
    }

    struct DepositRequest {
        address to;
        uint256 tokenAmount;
        uint256 amount;
        uint256 cost;
        uint256 requestValue;
        uint8 wave;
        uint256 expireTo;
        bool notBid;
        bytes signature;
    }

    struct Bid {
        address to;
        uint256 tokenAmount;
        uint256 amount;
        uint256 cost;
        uint256 requestValue;
        uint8 wave;
        uint256 createdAt;
    }

    struct BidRequest {
        address to;
        uint256 tokenAmount;
        uint256 amount;
        uint256 cost;
        uint256 requestValue;
        uint8 wave;
        bytes signature;
    }

    struct WaveInfo {
        uint8 index;
        uint256 limit;
        uint256 bid;
        uint256 bidToken;
        uint256 deposit;
        uint256 depositToken;
        uint depositCount;
        uint bidCount;
    }

    enum LogAction {
        Bid,
        Deposit,
        BigDeposit
    }

    struct Log {
        address to;
        LogAction action;
        uint256 amount;
        uint256 tokenAmount;
        uint256 cost;
        uint8 wave;
        uint256 createdAt;
    }

    event Bet(address indexed from, Bid _value);
    event Deposited(address indexed from, Deposit _value);

    event SaleOpened();
    event SaleClosed();

    VRVBeta private _token;

    bool public opened;
    bool public closed;
    uint256 public closeAt;

    uint256 private _softCap;
    uint256 private _hardCap;
    bool private _successful;

    uint8 private _waveCount;
    mapping(uint8 => WaveInfo) private _waves;
    WaveInfo private _afterSaleWave;
    bool private _registeredAfterSaleWave;

    uint256 private _bidSum;
    uint256 private _depositSum;
    uint256 private _soldSum;

    // Индекс волны => (address => Bid)
    mapping(uint8 => mapping(address => Bid)) private _bids;

    // Индекс депозита
    uint256 private _depositIndex;
    uint256[] private _allDeposits;
    mapping(uint256 depositIndex => Deposit) private _deposits;
    mapping(address owner => uint256[]) private _depositOwners;

    Log[] private _log;

    constructor(address vrvToken)
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
        Ownable(_msgSender())
    {
        _token = VRVBeta(vrvToken);

        opened = false;
        closed = false;
        _registeredAfterSaleWave = false;
    }

    function openSale(
        uint256 softCap,
        uint256 hardCap,
        uint8 waveCount,
        uint256 waveLimit,
        uint _closeAt
    ) external onlyOwner {
        if (true == opened) {
            revert PrivateSaleOpened();
        }

        _softCap = softCap;
        _hardCap = hardCap;
        _waveCount = waveCount;
        closeAt = _closeAt;

        for (uint8 i = 0; i < _waveCount; ++i) {
            _waves[i] = WaveInfo(
                i, waveLimit, 0, 0, 0, 0, 0, 0
            );
        }

        _open();
    }

    function registerAfterWave(uint _closeAt) external onlyOwner {
        if (!_registeredAfterSaleWave) {
            uint256 afterWaveLimit;

            for (uint8 i = 0; i < _waveCount; ++i) {
                afterWaveLimit += _waves[i].limit - _waves[i].deposit;
            }

            _afterSaleWave = WaveInfo(_waveCount, afterWaveLimit, 0, 0, 0, 0, 0, 0);

            closeAt = _closeAt;
            _registeredAfterSaleWave = true;
        } else {
            revert PrivateSaleAfterWaveRegistered();
        }
    }

    function getLogs() external view returns(Log[] memory) {
        return _log;
    }

    function bid(BidRequest calldata request) external payable {
        _calculateCap();

        if (closed || !opened) {
            revert PrivateSaleClosed();
        }

        address signer = _getSignerBidRequest(request);

        if (owner() != signer) {
            revert PrivateSaleFailedSignature(signer);
        }

        if (request.to != _msgSender()) {
            revert PrivateSaleFailedSender();
        }

        if (msg.value < request.requestValue) {
            revert PrivateSaleInsufficientBalance();
        }

        if (request.wave >= _waveCount) {
            revert PrivateSaleFailedWaveIndex();
        }

        if (this.getBid(request.to, request.wave).to != NULL_ADDRESS) {
            revert PrivateSaleDepositBidExist();
        }

        _bids[request.wave][request.to] = Bid(
            request.to,
            request.tokenAmount,
            request.amount,
            request.cost,
            request.requestValue,
            request.wave,
            block.timestamp
        );

        _bidSum += request.requestValue;

        _waves[request.wave].bidToken += request.tokenAmount;
        _waves[request.wave].bid += request.requestValue;
        _waves[request.wave].bidCount++;

        emit Bet(request.to, _bids[request.wave][request.to]);

        _pushLog(Log(
            request.to,
            LogAction.Bid,
            request.amount,
            request.tokenAmount,
            request.cost,
            request.wave,
            block.timestamp
        ));
    }

    function deposit(DepositRequest calldata request) external payable {
        _calculateCap();

        if (closed || !opened) {
            revert PrivateSaleClosed();
        }

        address signer = _getSignerDepositRequest(request);

        if (owner() != signer) {
            revert PrivateSaleFailedSignature(signer);
        }

        if (request.to != _msgSender()) {
            revert PrivateSaleFailedSender();
        }

        if (msg.value < request.requestValue) {
            revert PrivateSaleInsufficientBalance();
        }

        if (_registeredAfterSaleWave) {
            if (request.wave != _waveCount ) {
                revert PrivateSaleFailedWaveIndex();
            }

            if (_afterSaleWave.limit < request.tokenAmount) {
                revert PrivateSaleWaveLimitExceeded(_afterSaleWave.limit);
            }
        } else {
            if (request.wave >= _waveCount) {
                revert PrivateSaleFailedWaveIndex();
            } else {
                if (_waves[request.wave].limit < request.tokenAmount) {
                    revert PrivateSaleWaveLimitExceeded(_waves[request.wave].limit);
                }
            }

            if (!request.notBid) {
                Bid memory _bid = getBid(_msgSender(), request.wave);

                if (_bid.to == NULL_ADDRESS) {
                    revert PrivateSaleDepositBidNotFound();
                }

                if (request.tokenAmount > _bid.tokenAmount) {
                    revert PrivateSaleDepositFailedTokenAmount();
                }
            }
        }

        if (request.expireTo <= block.timestamp) {
            revert PrivateSaleDepositExpired();
        }

        Deposit memory dep = Deposit(
            payable(request.to),
            request.tokenAmount,
            request.amount,
            request.cost,
            request.requestValue,
            request.wave,
            block.timestamp,
            request.notBid,
            0
        );

        _deposits[_depositIndex] = dep;
        _depositOwners[_msgSender()].push(_depositIndex);
        _allDeposits.push(_depositIndex);
        _depositIndex++;

        if (request.wave >= _waveCount) {
            _afterSaleWave.deposit += request.amount;
            _afterSaleWave.depositToken += request.tokenAmount;
            _afterSaleWave.depositCount++;
            _afterSaleWave.limit -= request.tokenAmount;
        } else {
            _waves[request.wave].deposit += request.amount;
            _waves[request.wave].depositToken += request.tokenAmount;
            _waves[request.wave].depositCount++;
            _waves[request.wave].limit -= request.tokenAmount;
        }

        _depositSum += request.amount;
        _soldSum += request.tokenAmount;

        if (0 < request.tokenAmount) {
            _token.transfer(request.to, request.tokenAmount);
        }

        emit Deposited(_msgSender(), dep);

        LogAction action = LogAction.Deposit;
        if (request.notBid) {
            action = LogAction.BigDeposit;
        }

        _pushLog(Log(
            request.to,
            action,
            request.amount,
            request.tokenAmount,
            request.cost,
            request.wave,
            block.timestamp
        ));

        _calculateCap();
    }

    function finish(address payable transferTo) external onlyOwner {
        _calculateCap();

        if (closed && _successful) {
            _transfer(transferTo);
        } else if (closed && !_successful) {
            _revertDeposits(transferTo);
        } else {
            revert PrivateSaleOpened();
        }
    }

    function getBidSum() external view returns (uint256) {
        return _bidSum;
    }

    function getDepositSum() external view returns (uint256) {
        return _depositSum;
    }

    function getSoldSum() external view returns (uint256) {
        return _soldSum;
    }

    function getWaveInfo(uint8 waveIndex) external view returns (WaveInfo memory) {
        if (waveIndex >= _waveCount) {
            if (_registeredAfterSaleWave) {
                return getAfterSaleWave();
            }

            revert PrivateSaleFailedWaveIndex();
        }

        return _waves[waveIndex];
    }

    function getDepositIndexList() external view returns (uint256[] memory) {
        return _allDeposits;
    }

    function getDeposit(uint256 index) external view returns (Deposit memory) {
        return _deposits[index];
    }

    function getAfterSaleWave() public view onlyOwner returns (WaveInfo memory) {
        if (_registeredAfterSaleWave) {
            return _afterSaleWave;
        }

        revert PrivateSaleAfterWaveNotRegistered();
    }

    function getBid(address to, uint8 waveIndex) public view returns(Bid memory) {
        return _bids[waveIndex][to];
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance() public view returns (uint256) {
        return _token.balanceOf(address(this));
    }

    function _pushLog(Log memory log) private {
        _log.push(log);
    }

    function _getSignerBidRequest(BidRequest calldata request) private view returns (address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("BidRequest(address to,uint256 tokenAmount,uint256 amount,uint256 cost,uint256 requestValue,uint8 wave)"),
                    request.to,
                    request.tokenAmount,
                    request.amount,
                    request.cost,
                    request.requestValue,
                    request.wave
                )
            )
        );

        return ECDSA.recover(digest, request.signature);
    }

    function _getSignerDepositRequest(DepositRequest calldata request) private view returns (address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("DepositRequest(address to,uint256 tokenAmount,uint256 amount,uint256 cost,uint256 requestValue,uint8 wave,uint256 expireTo,bool notBid)"),
                    request.to,
                    request.tokenAmount,
                    request.amount,
                    request.cost,
                    request.requestValue,
                    request.wave,
                    request.expireTo,
                    request.notBid
                )
            )
        );

        return ECDSA.recover(digest, request.signature);
    }

    function _calculateCap() private {
        if (opened) {
            if (_depositSum < _softCap) {
                _successful = false;
            }

            if (_depositSum >= _softCap) {
                _successful = true;
            }

            if (_depositSum >= _hardCap || block.timestamp >= closeAt) {
                _close();
            }
        }
    }

    function _transfer(address payable transferTo) private {
        if (0 < getTokenBalance()) {
            _token.transfer(transferTo, getTokenBalance());
        }
        if (0 < getBalance()) {
            transferTo.call{value: getBalance()}("");
        }
    }

    function _revertDeposits(address payable transferTo) private {
        uint256 _fee = block.gaslimit / _depositIndex;
        for (uint256 i = 0; i < _depositIndex; i++) {
            Deposit memory dep = _deposits[i];
            if (0 == dep.withdrawal && 0 < (dep.requestValue - _fee)) {
                dep.to.transfer(dep.requestValue - _fee);
                dep.withdrawal = dep.requestValue;
                _deposits[i] = dep;
            }
        }

        _transfer(transferTo);
    }

    function _open() private {
        opened = true;

        emit SaleOpened();
    }

    function _close() private {
        closed = true;

        emit SaleClosed();
    }
}
