import { Link } from 'react-router-dom'
import { Zap, Shield, TrendingUp, Users, Award, Coins } from 'lucide-react'

export const HomePage = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Earn Crypto by <span className="text-primary-600">Completing Tasks</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
          Task Chainz is a decentralized platform where you can earn cryptocurrency tokens
          by completing tasks or create bounties for tasks you need done.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/tasks" className="btn btn-primary text-lg px-8 py-3">
            Browse Tasks
          </Link>
          <Link to="/create-task" className="btn btn-outline text-lg px-8 py-3">
            Create a Task
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Zap className="w-12 h-12 text-primary-600" />}
          title="Instant Payments"
          description="Get paid instantly in TASKZ tokens when your work is approved. No waiting for payment processors."
        />
        <FeatureCard
          icon={<Shield className="w-12 h-12 text-primary-600" />}
          title="Secure Escrow"
          description="All task payments are held in smart contract escrow until work is completed and approved."
        />
        <FeatureCard
          icon={<TrendingUp className="w-12 h-12 text-primary-600" />}
          title="Build Reputation"
          description="Earn reputation NFTs and climb the leaderboard as you complete more tasks successfully."
        />
        <FeatureCard
          icon={<Users className="w-12 h-12 text-primary-600" />}
          title="DAO Governance"
          description="Participate in platform governance and dispute resolution through decentralized voting."
        />
        <FeatureCard
          icon={<Award className="w-12 h-12 text-primary-600" />}
          title="Achievements & Streaks"
          description="Unlock achievements, maintain streaks, and earn bonus rewards for consistent performance."
        />
        <FeatureCard
          icon={<Coins className="w-12 h-12 text-primary-600" />}
          title="Stake & Earn"
          description="Stake your tokens to create high-value tasks and earn additional rewards."
        />
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Connect Your Wallet"
            description="Connect your MetaMask or other Web3 wallet to get started."
          />
          <StepCard
            number="2"
            title="Find or Create Tasks"
            description="Browse available tasks to work on or create your own task with a bounty."
          />
          <StepCard
            number="3"
            title="Complete & Earn"
            description="Submit your work, get approved, and receive instant crypto payments."
          />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Active Tasks" value="1,234" />
        <StatCard label="Total Earned" value="$125K" />
        <StatCard label="Active Users" value="5,678" />
        <StatCard label="Tasks Completed" value="10K+" />
      </section>

      {/* CTA */}
      <section className="text-center bg-primary-600 text-white rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of users already earning crypto on Task Chainz
        </p>
        <Link to="/tasks" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
          Get Started Now
        </Link>
      </section>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }: any) => (
  <div className="card text-center">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
)

const StepCard = ({ number, title, description }: any) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
      {number}
    </div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
)

const StatCard = ({ label, value }: any) => (
  <div className="card text-center">
    <div className="text-3xl font-bold text-primary-600 mb-2">{value}</div>
    <div className="text-gray-600 dark:text-gray-400">{label}</div>
  </div>
)
