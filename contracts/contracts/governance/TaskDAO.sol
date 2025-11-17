// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TaskDAO
 * @dev DAO for governance and dispute resolution in Task-Chainz
 */
contract TaskDAO is Ownable {
    IERC20 public governanceToken;
    
    enum ProposalType { DisputeResolution, ParameterChange, General }
    enum ProposalStatus { Pending, Active, Succeeded, Defeated, Executed }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        ProposalType proposalType;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
        bytes executionData;
    }
    
    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    
    uint256 public votingPeriod = 50400; // ~1 week in blocks (assuming 12s blocks)
    uint256 public proposalThreshold = 1000 * 10**18; // 1000 tokens to create proposal
    uint256 public quorumVotes = 10000 * 10**18; // 10000 tokens quorum
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    
    constructor(address _governanceToken) Ownable(msg.sender) {
        governanceToken = IERC20(_governanceToken);
    }
    
    /**
     * @dev Creates a new proposal
     */
    function propose(
        string memory description,
        ProposalType proposalType,
        bytes memory executionData
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "Insufficient tokens to propose"
        );
        
        uint256 proposalId = _proposalIdCounter++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.startBlock = block.number;
        proposal.endBlock = block.number + votingPeriod;
        proposal.status = ProposalStatus.Active;
        proposal.executionData = executionData;
        
        emit ProposalCreated(proposalId, msg.sender, description);
        
        return proposalId;
    }
    
    /**
     * @dev Casts vote on a proposal
     */
    function castVote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.number <= proposal.endBlock, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 votes = governanceToken.balanceOf(msg.sender);
        require(votes > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votes);
    }
    
    /**
     * @dev Finalizes proposal after voting period
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.number > proposal.endBlock, "Voting period not ended");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        
        if (totalVotes < quorumVotes) {
            proposal.status = ProposalStatus.Defeated;
        } else if (proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Succeeded;
        } else {
            proposal.status = ProposalStatus.Defeated;
        }
    }
    
    /**
     * @dev Executes a successful proposal (only owner for now)
     */
    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Succeeded, "Proposal not succeeded");
        
        proposal.status = ProposalStatus.Executed;
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Updates voting parameters
     */
    function setVotingParameters(
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumVotes
    ) external onlyOwner {
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumVotes = _quorumVotes;
    }
    
    /**
     * @dev Returns proposal details (without mapping)
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        ProposalType proposalType,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startBlock,
        uint256 endBlock,
        ProposalStatus status
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.proposalType,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startBlock,
            proposal.endBlock,
            proposal.status
        );
    }
    
    /**
     * @dev Checks if address has voted on proposal
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
}
