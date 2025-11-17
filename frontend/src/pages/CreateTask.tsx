import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './CreateTask.css';

const CreateTask = () => {
  const { isConnected } = useWeb3();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bounty: '',
    deadline: '',
    category: 'Development'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    // TODO: Implement task creation with smart contract interaction
    console.log('Creating task:', formData);
    alert('Task creation will be implemented with smart contract integration');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="create-task">
      <h1>Create a New Task</h1>
      
      {!isConnected ? (
        <div className="card">
          <p>Please connect your wallet to create a task</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              className="input"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Build a React component"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              className="input textarea"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Provide detailed requirements for the task..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Writing">Writing</option>
                <option value="Data">Data</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bounty">Bounty (TASKZ) *</label>
              <input
                type="number"
                id="bounty"
                name="bounty"
                className="input"
                value={formData.bounty}
                onChange={handleChange}
                required
                min="1"
                step="1"
                placeholder="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="deadline">Deadline *</label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                className="input"
                value={formData.deadline}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-info">
            <p>ℹ️ Your bounty will be held in escrow until the task is completed</p>
            <p>ℹ️ A 2.5% platform fee will be deducted from the bounty</p>
          </div>

          <button type="submit" className="button button-primary submit-btn">
            Create Task
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateTask;
