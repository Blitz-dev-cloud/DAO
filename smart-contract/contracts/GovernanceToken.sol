// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20, Ownable {
    constructor(uint initialsupply) ERC20("DAOToken", "DAO") Ownable(msg.sender){
        _mint(msg.sender, initialsupply);
    }

    function mint(address to, uint256 amount) public onlyOwner{
        _mint(to, amount);
    }

}