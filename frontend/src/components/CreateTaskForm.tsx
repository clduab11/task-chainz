'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useTaskChainz } from '../hooks/useTaskChainz';
import { useIPFS, TaskMetadata } from '../hooks/useIPFS';

export function CreateTaskForm() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { createTask, isPending, isConfirming, isSuccess } = useTaskChainz(chainId);
  const { uploadJSON, isUploading } = useIPFS();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: '',
    difficulty: 'medium' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      alert('Please connect your wallet');
      return;
    }

    try {
      // Create task metadata
      const metadata: TaskMetadata = {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
      };

      // Upload to IPFS
      const ipfsHash = await uploadJSON(metadata);

      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);

      // Create task on chain
      await createTask(ipfsHash, formData.reward, deadlineTimestamp);

      // Reset form on success
      if (isSuccess) {
        setFormData({
          title: '',
          description: '',
          reward: '',
          deadline: '',
          difficulty: 'medium',
        });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const isLoading = isUploading || isPending || isConfirming;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Task</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reward (TASK)</label>
            <input
              type="number"
              step="0.01"
              value={formData.reward}
              onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) =>
              setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isLoading || !isConnected
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isUploading
            ? 'Uploading to IPFS...'
            : isPending
            ? 'Confirm in Wallet...'
            : isConfirming
            ? 'Creating Task...'
            : 'Create Task'}
        </button>

        {isSuccess && (
          <p className="text-green-600 text-sm">Task created successfully!</p>
        )}
      </form>
    </div>
  );
}
