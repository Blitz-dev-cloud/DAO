import React from "react";

const Navbar = ({ account, isOwner, connectWallet }) => {
  return (
    <nav className="navbar flex items-center justify-between px-4 py-3 bg-gray-900 text-white shadow">
      <div className="navbar-brand text-xl font-bold">DAO</div>
      <div className="navbar-account flex items-center gap-4">
        {isOwner && (
          <span className="owner-badge bg-yellow-500 text-black px-2 py-1 rounded">
            Admin
          </span>
        )}
        {account ? (
          <span className="account-address bg-gray-700 px-3 py-1 rounded">
            {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </span>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
