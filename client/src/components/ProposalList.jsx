import React from "react";
import ProposalCard from "./ProposalCard";

const ProposalList = ({ proposals, castVote, executeProposal, account }) => {
  const sortedProposals = [...proposals].sort((a, b) => b.id - a.id);

  return (
    <div className="proposal-list">
      <h2>Proposals ({proposals.length})</h2>
      {proposals.length === 0 ? (
        <div className="no-proposals">No proposals have been created yet.</div>
      ) : (
        sortedProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            castVote={castVote}
            executeProposal={executeProposal}
            account={account}
          />
        ))
      )}
    </div>
  );
};

export default ProposalList;
