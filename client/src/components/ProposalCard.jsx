import React from "react";

const ProposalCard = ({ proposal, castVote, executeProposal, account }) => {
  const totalVotes =
    parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes);
  const forPercentage =
    totalVotes > 0 ? (parseFloat(proposal.forVotes) / totalVotes) * 100 : 0;
  const againstPercentage =
    totalVotes > 0 ? (parseFloat(proposal.againstVotes) / totalVotes) * 100 : 0;

  const now = Date.now() / 1000;
  const endTime = new Date(proposal.endTime).getTime() / 1000;
  const isActive = now < endTime;

  const timeDiff = Math.abs(endTime - now);
  const days = Math.floor(timeDiff / 86400);
  const hours = Math.floor((timeDiff % 86400) / 3600);
  const minutes = Math.floor((timeDiff % 3600) / 60);

  let timeStatus;
  if (isActive) {
    timeStatus = `Ends in ${days}d ${hours}h ${minutes}m`;
  } else {
    timeStatus = `Ended ${days}d ${hours}h ${minutes}m ago`;
  }

  return (
    <div
      className={`proposal-card ${proposal.executed ? "executed" : ""} ${
        !isActive ? "ended" : ""
      }`}
    >
      <div className="proposal-header">
        <div className="proposal-id">ID: {proposal.id}</div>
        <div
          className={`proposal-status ${
            proposal.executed ? "executed" : isActive ? "active" : "ended"
          }`}
        >
          {proposal.executed ? "Executed" : isActive ? "Active" : "Ended"}
        </div>
      </div>

      <h3 className="proposal-description">{proposal.description}</h3>

      <div className="proposal-info">
        <div>
          Proposer: {proposal.proposer.substring(0, 6)}...
          {proposal.proposer.substring(proposal.proposer.length - 4)}
        </div>
        <div>{timeStatus}</div>
      </div>

      <div className="voting-stats">
        <div className="votes-bar">
          <div
            className="for-votes"
            style={{ width: `${forPercentage}%` }}
          ></div>
          <div
            className="against-votes"
            style={{ width: `${againstPercentage}%` }}
          ></div>
        </div>
        <div className="votes-numbers">
          <div className="for">For: {proposal.forVotes}</div>
          <div className="against">Against: {proposal.againstVotes}</div>
          <div className="total">
            Total:{" "}
            {(
              parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes)
            ).toFixed(2)}
          </div>
        </div>
      </div>

      {isActive && !proposal.hasVoted && (
        <div className="voting-actions">
          <button
            className="vote-for"
            onClick={() => castVote(proposal.id, true)}
            disabled={!account}
          >
            Vote For
          </button>
          <button
            className="vote-against"
            onClick={() => castVote(proposal.id, false)}
            disabled={!account}
          >
            Vote Against
          </button>
        </div>
      )}

      {!isActive && !proposal.executed && (
        <div className="execution-actions">
          <button
            className="execute-proposal"
            onClick={() => executeProposal(proposal.id)}
            disabled={!account}
          >
            Execute Proposal
          </button>
        </div>
      )}

      {proposal.hasVoted && (
        <div className="voted-badge">You have voted on this proposal</div>
      )}
    </div>
  );
};

export default ProposalCard;
