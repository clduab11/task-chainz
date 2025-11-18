'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { CreateTaskForm } from '../components/CreateTaskForm';
import { useTaskChainz, useUserStats } from '../hooks/useTaskChainz';

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { totalTasks } = useTaskChainz(chainId);
  const { completedCount, formattedEarnings } = useUserStats(chainId, address);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-blue-600">TaskChainz</h1>
            <span className="text-sm text-gray-500">Web3 Task Platform</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
              <p className="text-3xl font-bold text-gray-900">
                {totalTasks?.toString() || '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Your Completed</h3>
              <p className="text-3xl font-bold text-green-600">
                {completedCount?.toString() || '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Earned</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formattedEarnings} TASK
              </p>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Task */}
          {isConnected ? (
            <CreateTaskForm />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to TaskChainz</h2>
              <p className="text-gray-600 mb-4">
                Connect your wallet to create tasks, earn rewards, and manage your decentralized
                task workflow.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Create tasks with TASK token rewards</li>
                <li>Complete tasks and earn tokens</li>
                <li>Task metadata stored on IPFS</li>
                <li>Signature-based verification</li>
              </ul>
            </div>
          )}

          {/* Task List Placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Open Tasks</h2>
            {isConnected ? (
              <div className="text-gray-500 text-center py-8">
                <p>No open tasks yet.</p>
                <p className="text-sm mt-2">Create your first task to get started!</p>
              </div>
            ) : (
              <p className="text-gray-500">Connect wallet to view tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-500 text-sm">
          TaskChainz - Decentralized Task Management Platform
        </div>
      </footer>
    </main>
  );
}
