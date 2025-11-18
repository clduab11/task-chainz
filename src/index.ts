/**
 * TaskChainz SDK - Web3 Task Management Platform
 *
 * This SDK provides utilities for interacting with TaskChainz smart contracts,
 * including task creation, completion, and token rewards management.
 */

export { TaskChainz__factory } from "../typechain-types/factories/contracts/TaskChainz__factory";
export { TaskToken__factory } from "../typechain-types/factories/contracts/TaskToken__factory";
export type { TaskChainz } from "../typechain-types/contracts/TaskChainz";
export type { TaskToken } from "../typechain-types/contracts/TaskToken";

// Task status enum matching the contract
export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4,
}

// Task interface for TypeScript usage
export interface Task {
  id: bigint;
  creator: string;
  assignee: string;
  ipfsHash: string;
  reward: bigint;
  deadline: bigint;
  status: TaskStatus;
  createdAt: bigint;
  completedAt: bigint;
  completionIpfsHash: string;
}

// Task metadata stored on IPFS
export interface TaskMetadata {
  title: string;
  description: string;
  requirements?: string[];
  tags?: string[];
  difficulty?: "easy" | "medium" | "hard";
  estimatedTime?: string;
  createdBy?: string;
}

// Completion proof stored on IPFS
export interface CompletionProof {
  taskId: number;
  description: string;
  evidence?: string[];
  submittedAt: string;
  submittedBy: string;
}

// Contract addresses by network
export const CONTRACT_ADDRESSES: Record<string, { taskToken: string; taskChainz: string }> = {
  // Mainnet
  "1": {
    taskToken: "",
    taskChainz: "",
  },
  // Sepolia testnet
  "11155111": {
    taskToken: "",
    taskChainz: "",
  },
  // Hardhat local
  "31337": {
    taskToken: "",
    taskChainz: "",
  },
};

// Utility function to format token amounts
export function formatTaskTokens(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  const remainderStr = remainder.toString().padStart(decimals, "0").slice(0, 4);
  return `${whole}.${remainderStr}`;
}

// Utility function to parse token amounts
export function parseTaskTokens(amount: string, decimals: number = 18): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

// Calculate platform fee
export function calculateFee(reward: bigint, feePercentage: number = 250): bigint {
  return (reward * BigInt(feePercentage)) / BigInt(10000);
}

// Calculate net reward after fee
export function calculateNetReward(reward: bigint, feePercentage: number = 250): bigint {
  const fee = calculateFee(reward, feePercentage);
  return reward - fee;
}

// Version info
export const VERSION = "1.0.0";
