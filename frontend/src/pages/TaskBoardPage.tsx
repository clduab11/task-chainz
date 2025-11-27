import { useState } from 'react'
import { Search } from 'lucide-react'

export const TaskBoardPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('all')

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Browse Tasks</h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="writing">Writing</option>
            <option value="marketing">Marketing</option>
            <option value="research">Research</option>
            <option value="testing">Testing</option>
          </select>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TaskCard
          title="Build React Component Library"
          category="Development"
          bounty="500 TASKZ"
          deadline="3 days"
          reputation={1000}
          isUrgent={true}
        />
        <TaskCard
          title="Design Landing Page Mockup"
          category="Design"
          bounty="250 TASKZ"
          deadline="5 days"
          reputation={500}
          isUrgent={false}
        />
        <TaskCard
          title="Write Technical Documentation"
          category="Writing"
          bounty="300 TASKZ"
          deadline="7 days"
          reputation={750}
          isUrgent={false}
        />
      </div>
    </div>
  )
}

const TaskCard = ({ title, category, bounty, deadline, reputation, isUrgent }: any) => (
  <div className="card hover:shadow-xl transition-shadow cursor-pointer">
    <div className="flex justify-between items-start mb-3">
      <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full text-sm font-medium">
        {category}
      </span>
      {isUrgent && (
        <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm font-medium">
          Urgent
        </span>
      )}
    </div>

    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>

    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex justify-between">
        <span>Bounty:</span>
        <span className="font-semibold text-primary-600">{bounty}</span>
      </div>
      <div className="flex justify-between">
        <span>Deadline:</span>
        <span className="font-semibold">{deadline}</span>
      </div>
      <div className="flex justify-between">
        <span>Min. Reputation:</span>
        <span className="font-semibold">{reputation}</span>
      </div>
    </div>

    <button className="btn btn-primary w-full mt-4">
      View Details
    </button>
  </div>
)
