// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GovernanceToken.sol";

contract DAO is Ownable {
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    GovernanceToken public governanceToken;
    uint256 public proposalCount;
    uint256 public votingPeriod = 2 days;
    uint256 public quorum;

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description, uint256 startTime, uint256 endTime);
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event VotingPeriodChanged(uint256 newVotingPeriod);
    event QuorumChanged(uint256 newQuorum);

    constructor(address _tokenAddress, uint256 _quorum) Ownable(msg.sender) {
        governanceToken = GovernanceToken(_tokenAddress);
        quorum = _quorum;
    }

    function createProposal(string memory _description) public returns (uint256) {
        require(governanceToken.balanceOf(msg.sender) > 0, "Must hold governance tokens to create a proposal!");

        uint256 proposalId = proposalCount++;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = _description;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;

        emit ProposalCreated(proposalId, msg.sender, _description, newProposal.startTime, newProposal.endTime);

        return proposalId;
    }

    function castVote(uint256 proposalId, bool support) public {
        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp >= proposal.startTime, "Voting has not started");
        require(block.timestamp <= proposal.endTime, "Voting has ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 votes = governanceToken.balanceOf(msg.sender);
        require(votes > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;

        if(support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }

        emit VoteCast(msg.sender, proposalId, support, votes);
    }

    function executeProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp > proposal.endTime, "Voting period not over");
        require(!proposal.executed, "Proposal already executed");
        
        // Check if quorum is reached
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        require(totalVotes >= quorum, "Quorum not reached");
        
        // Check if proposal passed
        require(proposal.forVotes > proposal.againstVotes, "Proposal did not pass");

        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    function getProposal(uint256 proposalId) public view returns (
        address proposer,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startTime,
        uint256 endTime,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.executed
        );
    }

    function setVotingPeriod(uint256 newVotingPeriod) public onlyOwner {
        votingPeriod = newVotingPeriod;
        emit VotingPeriodChanged(newVotingPeriod);
    }

    function setQuorum(uint256 newQuorum) public onlyOwner {
        quorum = newQuorum;
        emit QuorumChanged(newQuorum);
    }
}