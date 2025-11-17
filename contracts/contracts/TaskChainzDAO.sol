// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TaskChainzDAO
 * @dev Decentralized governance for Task Chainz platform
 *
 * Features:
 * - Token-weighted voting
 * - Proposal creation and execution
 * - Timelock for proposal execution
 * - Quorum requirements
 * - Dispute resolution voting
 * - Platform parameter updates
 */
contract TaskChainzDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // Proposal types
    enum ProposalType {
        Standard,       // General governance proposal
        DisputeResolution, // Resolve task dispute
        EmergencyAction    // Emergency action (shorter timelock)
    }

    struct DisputeProposal {
        uint256 taskId;
        address creator;
        address worker;
        string ipfsHash; // Evidence and details
        bool resolved;
        bool favorCreator;
    }

    mapping(uint256 => ProposalType) public proposalTypes;
    mapping(uint256 => DisputeProposal) public disputeProposals;

    event DisputeProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed taskId,
        address creator,
        address worker
    );
    event DisputeResolved(uint256 indexed proposalId, uint256 indexed taskId, bool favorCreator);

    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        Governor("TaskChainz DAO")
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {}

    /**
     * @dev Create a dispute resolution proposal
     * @param taskId ID of the disputed task
     * @param creator Task creator address
     * @param worker Task worker address
     * @param evidenceHash IPFS hash containing dispute evidence
     * @param description Proposal description
     * @param targets Contract addresses to call
     * @param values ETH values for calls
     * @param calldatas Function call data
     */
    function createDisputeProposal(
        uint256 taskId,
        address creator,
        address worker,
        string memory evidenceHash,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256) {
        require(creator != address(0) && worker != address(0), "Invalid addresses");
        require(bytes(evidenceHash).length > 0, "Invalid evidence hash");

        uint256 proposalId = propose(targets, values, calldatas, description);

        proposalTypes[proposalId] = ProposalType.DisputeResolution;
        disputeProposals[proposalId] = DisputeProposal({
            taskId: taskId,
            creator: creator,
            worker: worker,
            ipfsHash: evidenceHash,
            resolved: false,
            favorCreator: false
        });

        emit DisputeProposalCreated(proposalId, taskId, creator, worker);

        return proposalId;
    }

    /**
     * @dev Execute dispute resolution after voting
     * @param proposalId ID of the proposal
     * @param favorCreator True if voting favors creator
     */
    function executeDisputeResolution(uint256 proposalId, bool favorCreator)
        external
        onlyGovernance
    {
        require(proposalTypes[proposalId] == ProposalType.DisputeResolution, "Not a dispute proposal");
        DisputeProposal storage dispute = disputeProposals[proposalId];
        require(!dispute.resolved, "Already resolved");

        dispute.resolved = true;
        dispute.favorCreator = favorCreator;

        emit DisputeResolved(proposalId, dispute.taskId, favorCreator);
    }

    /**
     * @dev Get dispute proposal details
     */
    function getDisputeProposal(uint256 proposalId)
        external
        view
        returns (
            uint256 taskId,
            address creator,
            address worker,
            string memory ipfsHash,
            bool resolved,
            bool favorCreator
        )
    {
        DisputeProposal memory dispute = disputeProposals[proposalId];
        return (
            dispute.taskId,
            dispute.creator,
            dispute.worker,
            dispute.ipfsHash,
            dispute.resolved,
            dispute.favorCreator
        );
    }

    // The following functions are overrides required by Solidity

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
