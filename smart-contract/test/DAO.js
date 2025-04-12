const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO Contract", function () {
  let GovernanceToken;
  let governanceToken;
  let DAO;
  let dao;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;
  let quorum;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
    GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy(initialSupply);

    quorum = ethers.parseEther("1000");

    DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(await governanceToken.getAddress(), quorum);

    await governanceToken.transfer(addr1.address, ethers.parseEther("10000"));
    await governanceToken.transfer(addr2.address, ethers.parseEther("5000"));
    await governanceToken.transfer(addr3.address, ethers.parseEther("2000"));
  });

  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      expect(await dao.governanceToken()).to.equal(
        await governanceToken.getAddress()
      );
    });

    it("Should set the right quorum", async function () {
      expect(await dao.quorum()).to.equal(quorum);
    });

    it("Should set the right owner", async function () {
      expect(await dao.owner()).to.equal(owner.address);
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow token holders to create proposals", async function () {
      const tx = await dao.connect(addr1).createProposal("First Test Proposal");
      const receipt = await tx.wait();

      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const timestamp = block.timestamp;

      const event = receipt.logs.find(
        (log) => dao.interface.parseLog(log).name === "ProposalCreated"
      );
      const parsedEvent = dao.interface.parseLog(event);

      expect(parsedEvent.args[0]).to.equal(0); // proposalId
      expect(parsedEvent.args[1]).to.equal(addr1.address); // proposer
      expect(parsedEvent.args[2]).to.equal("First Test Proposal"); // description

      expect(Number(parsedEvent.args[3])).to.be.closeTo(timestamp, 2); // startTime
      expect(Number(parsedEvent.args[4])).to.be.closeTo(
        timestamp + 2 * 24 * 60 * 60,
        2
      );

      expect(await dao.proposalCount()).to.equal(1);

      const proposal = await dao.getProposal(0);
      expect(proposal[0]).to.equal(addr1.address);
      expect(proposal[1]).to.equal("First Test Proposal");
    });

    it("Should not allow non-token holders to create proposals", async function () {
      const nonHolder = addrs[0];
      await expect(
        dao.connect(nonHolder).createProposal("Invalid Proposal")
      ).to.be.revertedWith("Must hold governance tokens to create a proposal!");
    });
  });

  describe("Voting Mechanism", function () {
    it("Should allow token holders to create proposals and vote", async function () {
      const tx = await dao
        .connect(addr1)
        .createProposal("Voting Test Proposal");
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => dao.interface.parseLog(log).name === "ProposalCreated"
      );
      expect(event).to.not.be.undefined;

      expect(await dao.proposalCount()).to.equal(1);

      await dao.connect(addr1).castVote(0, true);
      await dao.connect(addr2).castVote(0, false);
      await dao.connect(addr3).castVote(0, true);

      const proposal = await dao.getProposal(0);
      expect(proposal[2]).to.equal(ethers.parseEther("12000"));
      expect(proposal[3]).to.equal(ethers.parseEther("5000"));

      await expect(dao.connect(addr1).castVote(0, false)).to.be.revertedWith(
        "Already voted"
      );

      const nonHolder = addrs[0];
      await expect(dao.connect(nonHolder).castVote(0, true)).to.be.revertedWith(
        "No voting power"
      );

      expect(await dao.hasVoted(0, addr1.address)).to.equal(true);
      expect(await dao.hasVoted(0, nonHolder.address)).to.equal(false);
    });
  });

  describe("Proposal Execution", function () {
    beforeEach(async function () {
      await dao.connect(addr1).createProposal("Execution Test Proposal");
      await dao.connect(addr1).castVote(0, true);
      await dao.connect(addr2).castVote(0, true);
    });

    it("Should not allow execution before voting period ends", async function () {
      await expect(dao.executeProposal(0)).to.be.revertedWith(
        "Voting period not over"
      );
    });

    it("Should allow execution after voting period with sufficient support", async function () {
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      const tx = await dao.executeProposal(0);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => dao.interface.parseLog(log).name === "ProposalExecuted"
      );
      const parsedEvent = dao.interface.parseLog(event);

      expect(parsedEvent.args[0]).to.equal(0); // proposalId

      const proposal = await dao.getProposal(0);
      expect(proposal[6]).to.equal(true); // executed
    });

    it("Should not allow execution if proposal did not pass", async function () {
      await dao.connect(addr1).createProposal("Failed Proposal");
      await dao.connect(addr1).castVote(1, false);
      await dao.connect(addr2).castVote(1, false);

      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(dao.executeProposal(1)).to.be.revertedWith(
        "Proposal did not pass"
      );
    });

    it("Should not allow execution if quorum not reached", async function () {
      const higherQuorum = ethers.parseEther("3000");
      await dao.setQuorum(higherQuorum);

      await dao.connect(addr1).createProposal("Low Participation Proposal");

      await dao.connect(addr3).castVote(1, true);

      const currentQuorum = await dao.quorum();
      console.log(
        "Current quorum:",
        ethers.formatEther(currentQuorum),
        "tokens"
      );
      console.log(
        "Votes cast:",
        ethers.formatEther(ethers.parseEther("2000")),
        "tokens"
      );

      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(dao.executeProposal(1)).to.be.revertedWith(
        "Quorum not reached"
      );
    });

    it("Should not allow executing a proposal twice", async function () {
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await dao.executeProposal(0);
      await expect(dao.executeProposal(0)).to.be.revertedWith(
        "Proposal already executed"
      );
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to change voting period", async function () {
      const newVotingPeriod = 7 * 24 * 60 * 60;

      const tx = await dao.setVotingPeriod(newVotingPeriod);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => dao.interface.parseLog(log).name === "VotingPeriodChanged"
      );
      const parsedEvent = dao.interface.parseLog(event);

      expect(parsedEvent.args[0]).to.equal(newVotingPeriod);
      expect(await dao.votingPeriod()).to.equal(newVotingPeriod);
    });

    it("Should allow owner to change quorum", async function () {
      const newQuorum = ethers.parseEther("5000");

      const tx = await dao.setQuorum(newQuorum);
      const receipt = await tx.wait();

      // Check event was emitted correctly
      const event = receipt.logs.find(
        (log) => dao.interface.parseLog(log).name === "QuorumChanged"
      );
      const parsedEvent = dao.interface.parseLog(event);

      expect(parsedEvent.args[0]).to.equal(newQuorum);
      expect(await dao.quorum()).to.equal(newQuorum);
    });

    it("Should not allow non-owners to change voting period", async function () {
      await expect(
        dao.connect(addr1).setVotingPeriod(7 * 24 * 60 * 60)
      ).to.be.revertedWithCustomError(dao, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owners to change quorum", async function () {
      await expect(
        dao.connect(addr1).setQuorum(ethers.parseEther("5000"))
      ).to.be.revertedWithCustomError(dao, "OwnableUnauthorizedAccount");
    });
  });
});
