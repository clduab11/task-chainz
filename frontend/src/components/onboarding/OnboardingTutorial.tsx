import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useWeb3 } from '@/contexts/Web3Context';
import { analytics } from '@/lib/analytics';
import { secureStorage } from '@/lib/security';

const TUTORIAL_COMPLETED_KEY = 'taskchainz_tutorial_completed';

export const OnboardingTutorial = () => {
  const { isConnected } = useWeb3();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Welcome to Task Chainz!</h3>
          <p>Let's take a quick tour to help you get started earning crypto.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tutorial="connect-wallet"]',
      content: (
        <div>
          <h4 className="font-bold mb-2">Step 1: Connect Your Wallet</h4>
          <p>Click here to connect your MetaMask or WalletConnect wallet to the platform.</p>
        </div>
      ),
      spotlightClicks: true,
    },
    {
      target: '[data-tutorial="browse-tasks"]',
      content: (
        <div>
          <h4 className="font-bold mb-2">Step 2: Browse Available Tasks</h4>
          <p>Explore tasks posted by other users. Filter by category, bounty amount, or deadline.</p>
        </div>
      ),
    },
    {
      target: '[data-tutorial="create-task"]',
      content: (
        <div>
          <h4 className="font-bold mb-2">Step 3: Create Your Own Tasks</h4>
          <p>Need work done? Create a task with a bounty and let the community help!</p>
        </div>
      ),
    },
    {
      target: '[data-tutorial="leaderboard"]',
      content: (
        <div>
          <h4 className="font-bold mb-2">Climb the Leaderboard</h4>
          <p>Complete tasks to earn reputation points and unlock achievements. Top performers get bonus rewards!</p>
        </div>
      ),
    },
    {
      target: '[data-tutorial="dao"]',
      content: (
        <div>
          <h4 className="font-bold mb-2">Participate in Governance</h4>
          <p>Use your tokens to vote on platform proposals and help resolve disputes.</p>
        </div>
      ),
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">You're All Set!</h3>
          <p>Start by browsing tasks or creating your first one. Good luck!</p>
          <div className="mt-4 text-sm text-gray-500">
            Need help? Check our docs or join our Discord community.
          </div>
        </div>
      ),
      placement: 'center',
    },
  ];

  useEffect(() => {
    // Check if tutorial was completed
    const completed = secureStorage.get(TUTORIAL_COMPLETED_KEY);
    if (!completed && !isConnected) {
      // Start tutorial after a short delay
      const timer = setTimeout(() => {
        setRun(true);
        analytics.tutorialStarted();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleCallback = (data: CallBackProps) => {
    const { status, index, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      secureStorage.set(TUTORIAL_COMPLETED_KEY, 'true');

      if (status === STATUS.FINISHED) {
        analytics.tutorialCompleted();
      } else {
        analytics.tutorialSkipped(index);
      }
    } else if (action === 'next') {
      setStepIndex(index + 1);
    } else if (action === 'prev') {
      setStepIndex(index - 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={handleCallback}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      styles={{
        options: {
          primaryColor: '#0ea5e9',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        buttonNext: {
          backgroundColor: '#0ea5e9',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          marginRight: '10px',
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
      locale={{
        last: 'Get Started',
        skip: 'Skip Tutorial',
        next: 'Next',
        back: 'Back',
      }}
    />
  );
};

// Helper function to reset tutorial (for testing)
export const resetTutorial = () => {
  secureStorage.remove(TUTORIAL_COMPLETED_KEY);
};
