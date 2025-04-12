import React, { useState } from "react";

const ProposalForm = ({ createProposal, hasTokens }) => {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !hasTokens || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await createProposal(description);
      setDescription("");
    } catch (err) {
      console.error("Submit proposal error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="proposal-form-card">
      <h2>Create New Proposal</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Proposal Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your proposal..."
            required
            rows={4}
          />
        </div>
        <button type="submit" disabled={!hasTokens || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Proposal"}
        </button>
      </form>
      {!hasTokens && (
        <div className="no-tokens-warning">
          You need governance tokens to create a proposal.
        </div>
      )}
    </div>
  );
};

export default ProposalForm;
