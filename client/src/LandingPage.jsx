import React from "react";
import "./App.css";

export default function LandingPage({ connectWallet, memberCount = 0 }) {
  return (
    <div
      style={{
        backgroundImage:
          "linear-gradient(to right top, #d16ba5, #c777b9, #ba83ca, #aa8fd8, #9a9ae1, #8aa7ec, #79b3f4, #69bff8, #52cffe, #41dfff, #46eefa, #5ffbf1)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="glass-card">
        <div className="dao-logo">
          <span className="pixel-text">WELCOME TO </span>
          <br />
          <span className="pixel-text highlight"> DAO</span>
        </div>

        <div className="dao-description">
          <p>
            Join our decentralized adventure! Govern together, build together,
            win together.
          </p>
        </div>

        <div className="dao-stats">
          <div className="stat-item members">
            <span className="stat-label">MEMBERS</span>
            <span className="stat-value">{memberCount}</span>
          </div>
          <div className="stat-item treasury">
            <span className="stat-label">TREASURY</span>
            <span className="stat-value">256 ETH</span>
          </div>
        </div>

        <button onClick={connectWallet} className="connect-wallet-btn">
          CONNECT WALLET
        </button>

        <div className="social-links">
          <a href="#" className="social-link">
            DISCORD
          </a>
          <a href="#" className="social-link">
            TWITTER
          </a>
          <a href="#" className="social-link">
            GITHUB
          </a>
        </div>
      </div>
    </div>
  );
}
