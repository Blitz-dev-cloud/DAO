import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import "./index.css";

import Navbar from "./components/Navbar";
import ProposalList from "./components/ProposalList";
import ProposalForm from "./components/ProposalForm";
import TokenInfo from "./components/TokenInfo";
import AdminPanel from "./components/AdminPanel";

import GovernanceTokenABI from "./abis/GovernanceToken.json";
import DAOABI from "./abis/DAO.json";
import LandingPage from "./LandingPage";

function App() {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [daoContract, setDaoContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingPeriod, setVotingPeriod] = useState(0);
  const [quorum, setQuorum] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const daoAddress = import.meta.env.VITE_DAO_ADDRESS;
  const tokenAddress = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  const [memberCount, setMemberCount] = useState(0);

  const fetchMemberCount = async () => {
    if (!tokenContract) return;

    try {
      const filter = tokenContract.filters.Transfer();
      const events = await tokenContract.queryFilter(filter);

      const uniqueAddresses = new Set();

      for (const event of events) {
        uniqueAddresses.add(event.args.to.toLowerCase());

        const balance = await tokenContract.balanceOf(event.args.to);
        if (balance.gt(0)) {
          uniqueAddresses.add(event.args.to.toLowerCase());
        }
      }

      setMemberCount(uniqueAddresses.size);
    } catch (err) {
      console.error("Error fetching member count:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);

          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);

            const web3Signer = await web3Provider.getSigner();
            setSigner(web3Signer);

            const tokenInstance = new ethers.Contract(
              tokenAddress,
              GovernanceTokenABI.abi,
              web3Signer
            );
            setTokenContract(tokenInstance);

            const daoInstance = new ethers.Contract(
              daoAddress,
              DAOABI.abi,
              web3Signer
            );
            setDaoContract(daoInstance);

            const owner = await daoInstance.owner();
            setIsOwner(
              owner.toLowerCase() === accounts[0].address.toLowerCase()
            );

            const balance = await tokenInstance.balanceOf(accounts[0].address);
            setTokenBalance(ethers.formatEther(balance));

            const currentVotingPeriod = await daoInstance.votingPeriod();
            setVotingPeriod(Number(currentVotingPeriod));

            const currentQuorum = await daoInstance.quorum();
            setQuorum(ethers.formatEther(currentQuorum));
          }

          window.ethereum.on("accountsChanged", (newAccounts) => {
            if (newAccounts.length === 0) {
              setAccount("");
              setSigner(null);
              setDaoContract(null);
              setTokenContract(null);
            } else {
              setAccount(newAccounts[0]);
              setRefreshTrigger((prev) => prev + 1);
            }
          });

          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to initialize the app: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  useEffect(() => {
    if (tokenContract) {
      fetchMemberCount();
    }
  }, [tokenContract]);

  useEffect(() => {
    const loadProposals = async () => {
      if (!daoContract) return;

      try {
        const proposalCount = await daoContract.proposalCount();
        const proposalArray = [];

        for (let i = 0; i < proposalCount; i++) {
          const proposalData = await daoContract.getProposal(i);
          const hasVoted = account
            ? await daoContract.hasVoted(i, account)
            : false;

          proposalArray.push({
            id: i,
            proposer: proposalData[0],
            description: proposalData[1],
            forVotes: ethers.formatEther(proposalData[2]),
            againstVotes: ethers.formatEther(proposalData[3]),
            startTime: new Date(
              Number(proposalData[4]) * 1000
            ).toLocaleString(),
            endTime: new Date(Number(proposalData[5]) * 1000).toLocaleString(),
            executed: proposalData[6],
            hasVoted: hasVoted,
            active: Date.now() / 1000 < Number(proposalData[5]),
          });
        }

        setProposals(proposalArray);
      } catch (err) {
        console.error("Error loading proposals:", err);
        setError("Failed to load proposals: " + err.message);
      }
    };

    if (daoContract && account) {
      loadProposals();
    }
  }, [daoContract, account, refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const createProposal = async (description) => {
    if (!daoContract) return;

    try {
      setLoading(true);
      const tx = await daoContract.createProposal(description);
      await tx.wait();
      refreshData();
    } catch (err) {
      console.error("Error creating proposal:", err);
      setError("Failed to create proposal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (proposalId, support) => {
    if (!daoContract) return;

    try {
      setLoading(true);
      const tx = await daoContract.castVote(proposalId, support);
      await tx.wait();
      refreshData();
    } catch (err) {
      console.error("Error casting vote:", err);
      setError("Failed to cast vote: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId) => {
    if (!daoContract) return;

    try {
      setLoading(true);
      const tx = await daoContract.executeProposal(proposalId);
      await tx.wait();
      refreshData();
    } catch (err) {
      console.error("Error executing proposal:", err);
      setError("Failed to execute proposal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDaoSettings = async (newVotingPeriod, newQuorum) => {
    if (!daoContract || !isOwner) return;

    try {
      setLoading(true);

      if (newVotingPeriod !== votingPeriod) {
        const tx = await daoContract.setVotingPeriod(newVotingPeriod);
        await tx.wait();
      }

      if (newQuorum !== quorum) {
        const tx = await daoContract.setQuorum(
          ethers.parseEther(newQuorum.toString())
        );
        await tx.wait();
      }

      setVotingPeriod(newVotingPeriod);
      setQuorum(newQuorum);
      refreshData();
    } catch (err) {
      console.error("Error updating DAO settings:", err);
      setError("Failed to update DAO settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !account) {
    return <div className="app-container">Loading application...</div>;
  }

  if (error) {
    return (
      <div className="app-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  // Show landing page if not connected to a wallet
  if (!account) {
    return (
      <LandingPage connectWallet={connectWallet} memberCount={memberCount} />
    );
  }

  return (
    <div className="app-container">
      <Navbar
        account={account}
        isOwner={isOwner}
        connectWallet={connectWallet}
      />

      <div className="main-content">
        <TokenInfo
          tokenBalance={tokenBalance}
          tokenAddress={tokenAddress}
          tokenContract={tokenContract}
          account={account}
        />

        <ProposalForm
          createProposal={createProposal}
          hasTokens={parseFloat(tokenBalance) > 0}
        />

        <ProposalList
          proposals={proposals}
          castVote={castVote}
          executeProposal={executeProposal}
          account={account}
        />

        {isOwner && (
          <AdminPanel
            votingPeriod={votingPeriod}
            quorum={quorum}
            updateDaoSettings={updateDaoSettings}
          />
        )}
      </div>
    </div>
  );
}

export default App;
