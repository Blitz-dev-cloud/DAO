import React, { useState } from "react";

const AdminPanel = ({ votingPeriod, quorum, updateDaoSettings }) => {
  const [newVotingPeriod, setNewVotingPeriod] = useState(votingPeriod);
  const [newQuorum, setNewQuorum] = useState(quorum);
  const [isUpdating, setIsUpdating] = useState(false);

  const votingPeriodDays = votingPeriod / (24 * 60 * 60);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      const periodInSeconds = Math.floor(newVotingPeriod * 24 * 60 * 60);
      await updateDaoSettings(periodInSeconds, newQuorum);
    } catch (err) {
      console.error("Update settings error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Voting Period (days):</label>
          <input
            type="number"
            value={
              newVotingPeriod === votingPeriod
                ? votingPeriodDays
                : newVotingPeriod
            }
            onChange={(e) => setNewVotingPeriod(parseFloat(e.target.value))}
            min="0.5"
            step="0.5"
            required
          />
        </div>
        <div className="form-group">
          <label>Quorum (tokens):</label>
          <input
            type="number"
            value={newQuorum}
            onChange={(e) => setNewQuorum(parseFloat(e.target.value))}
            min="1"
            step="1"
            required
          />
        </div>
        <button type="submit" disabled={isUpdating}>
          {isUpdating ? "Updating..." : "Update Settings"}
        </button>
      </form>

      <div className="current-settings">
        <h3>Current Settings</h3>
        <div>Voting Period: {votingPeriodDays} days</div>
        <div>Quorum: {quorum} tokens</div>
      </div>
    </div>
  );
};

export default AdminPanel;
