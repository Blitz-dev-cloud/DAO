import React, { useState } from "react";
import { ethers } from "ethers";

const TokenInfo = ({ tokenBalance, tokenAddress, tokenContract, account }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState("");

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!tokenContract || !recipient || !amount || amount <= 0) return;

    try {
      setTransferStatus("Transferring...");
      const tx = await tokenContract.transfer(
        recipient,
        ethers.parseEther(amount)
      );
      await tx.wait();
      setTransferStatus("Transfer successful!");
      setRecipient("");
      setAmount("");
      // Should trigger a refresh in the parent component
    } catch (err) {
      console.error("Transfer error:", err);
      setTransferStatus(`Transfer failed: ${err.message}`);
    }
  };

  return (
    <div className="token-info-card">
      <h2>Your Governance Tokens</h2>
      <div className="token-balance">
        <span>{tokenBalance}</span> DAO Tokens
      </div>
      <div className="token-address">
        Token Contract: {tokenAddress.substring(0, 6)}...
        {tokenAddress.substring(tokenAddress.length - 4)}
      </div>

      <div className="token-transfer">
        <h3>Transfer Tokens</h3>
        <form onSubmit={handleTransfer}>
          <div className="form-group">
            <label>Recipient Address:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              required
            />
          </div>
          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!tokenContract || !account || tokenBalance <= 0}
          >
            Transfer
          </button>
        </form>
        {transferStatus && (
          <div className="transfer-status">{transferStatus}</div>
        )}
      </div>
    </div>
  );
};

export default TokenInfo;
