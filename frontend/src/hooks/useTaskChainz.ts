import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '../lib/wagmi';

// TaskChainz ABI (subset for frontend usage)
const TASK_CHAINZ_ABI = [
  {
    name: 'createTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'ipfsHash', type: 'string' },
      { name: 'reward', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'taskId', type: 'uint256' }],
  },
  {
    name: 'assignTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'completeTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'completionIpfsHash', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'getTask',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'assignee', type: 'address' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'reward', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'completedAt', type: 'uint256' },
          { name: 'completionIpfsHash', type: 'string' },
        ],
      },
    ],
  },
  {
    name: 'totalTasks',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getUserStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'completedCount', type: 'uint256' },
      { name: 'totalEarnings', type: 'uint256' },
    ],
  },
  {
    name: 'getUserCreatedTasks',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'getUserAssignedTasks',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
] as const;

export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4,
}

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

export function useTaskChainz(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId];
  const contractAddress = addresses?.taskChainz as `0x${string}` | undefined;

  // Read total tasks
  const { data: totalTasks, refetch: refetchTotalTasks } = useReadContract({
    address: contractAddress,
    abi: TASK_CHAINZ_ABI,
    functionName: 'totalTasks',
  });

  // Write functions
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createTask = async (ipfsHash: string, reward: string, deadline: number) => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');

    writeContract({
      address: contractAddress,
      abi: TASK_CHAINZ_ABI,
      functionName: 'createTask',
      args: [ipfsHash, parseEther(reward), BigInt(deadline)],
    });
  };

  const assignTask = async (taskId: number) => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');

    writeContract({
      address: contractAddress,
      abi: TASK_CHAINZ_ABI,
      functionName: 'assignTask',
      args: [BigInt(taskId)],
    });
  };

  const completeTask = async (taskId: number, completionIpfsHash: string) => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');

    writeContract({
      address: contractAddress,
      abi: TASK_CHAINZ_ABI,
      functionName: 'completeTask',
      args: [BigInt(taskId), completionIpfsHash],
    });
  };

  return {
    totalTasks,
    refetchTotalTasks,
    createTask,
    assignTask,
    completeTask,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useTask(chainId: number, taskId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId];
  const contractAddress = addresses?.taskChainz as `0x${string}` | undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: TASK_CHAINZ_ABI,
    functionName: 'getTask',
    args: [BigInt(taskId)],
  });

  return {
    task: data as Task | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useUserStats(chainId: number, userAddress: string | undefined) {
  const addresses = CONTRACT_ADDRESSES[chainId];
  const contractAddress = addresses?.taskChainz as `0x${string}` | undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: TASK_CHAINZ_ABI,
    functionName: 'getUserStats',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  });

  return {
    completedCount: data?.[0],
    totalEarnings: data?.[1],
    formattedEarnings: data?.[1] ? formatEther(data[1]) : '0',
    isLoading,
    error,
    refetch,
  };
}
