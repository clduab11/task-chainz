import { Link } from 'react-router-dom'
import { useWeb3 } from '@/contexts/Web3Context'
import { Wallet, Menu, X } from 'lucide-react'
import { useState } from 'react'

export const Navbar = () => {
  const { account, isConnected, connect, disconnect, isConnecting } = useWeb3()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              Task Chainz
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/tasks"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
            >
              Browse Tasks
            </Link>
            <Link
              to="/create-task"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
            >
              Create Task
            </Link>
            <Link
              to="/leaderboard"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
            >
              Leaderboard
            </Link>
            <Link
              to="/dao"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
            >
              DAO
            </Link>
            <Link
              to="/staking"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
            >
              Staking
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <>
                <Link
                  to={`/profile/${account}`}
                  className="hidden md:block text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
                >
                  Profile
                </Link>
                <button
                  onClick={disconnect}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Wallet size={20} />
                  <span>{formatAddress(account!)}</span>
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Wallet size={20} />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-700 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              to="/tasks"
              className="block text-gray-700 dark:text-gray-300 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Tasks
            </Link>
            <Link
              to="/create-task"
              className="block text-gray-700 dark:text-gray-300 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Task
            </Link>
            <Link
              to="/leaderboard"
              className="block text-gray-700 dark:text-gray-300 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              to="/dao"
              className="block text-gray-700 dark:text-gray-300 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              DAO
            </Link>
            <Link
              to="/staking"
              className="block text-gray-700 dark:text-gray-300 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Staking
            </Link>
            {isConnected && (
              <Link
                to={`/profile/${account}`}
                className="block text-gray-700 dark:text-gray-300 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
