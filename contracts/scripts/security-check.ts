import * as fs from 'fs';
import * as path from 'path';

interface SecurityCheck {
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  check: () => Promise<{ passed: boolean; details: string }>;
}

async function runSecurityChecks() {
  console.log('🔒 Running Task Chainz Security Checks\n');
  console.log('='.repeat(60) + '\n');

  const checks: SecurityCheck[] = [
    {
      name: 'Reentrancy Guard',
      description: 'Check that all external functions use ReentrancyGuard',
      severity: 'critical',
      check: async () => {
        const contracts = ['TaskManager.sol', 'Gamification.sol'];
        let passed = true;
        let details = '';

        for (const contract of contracts) {
          const content = fs.readFileSync(
            path.join(__dirname, '..', 'contracts', contract),
            'utf8'
          );

          if (!content.includes('ReentrancyGuard')) {
            passed = false;
            details += `${contract} missing ReentrancyGuard\n`;
          }

          if (!content.includes('nonReentrant')) {
            passed = false;
            details += `${contract} missing nonReentrant modifier\n`;
          }
        }

        return { passed, details: details || 'All contracts have ReentrancyGuard' };
      },
    },
    {
      name: 'Access Control',
      description: 'Check that admin functions have proper access control',
      severity: 'critical',
      check: async () => {
        const contracts = ['TaskChainzToken.sol', 'ReputationNFT.sol', 'TaskManager.sol', 'Gamification.sol'];
        let passed = true;
        let details = '';

        for (const contract of contracts) {
          const content = fs.readFileSync(
            path.join(__dirname, '..', 'contracts', contract),
            'utf8'
          );

          if (!content.includes('AccessControl') && !content.includes('Ownable')) {
            passed = false;
            details += `${contract} missing AccessControl/Ownable\n`;
          }
        }

        return { passed, details: details || 'All contracts have access control' };
      },
    },
    {
      name: 'SafeERC20',
      description: 'Check that token transfers use SafeERC20',
      severity: 'high',
      check: async () => {
        const contracts = ['TaskManager.sol', 'Gamification.sol'];
        let passed = true;
        let details = '';

        for (const contract of contracts) {
          const content = fs.readFileSync(
            path.join(__dirname, '..', 'contracts', contract),
            'utf8'
          );

          if (!content.includes('SafeERC20')) {
            passed = false;
            details += `${contract} missing SafeERC20\n`;
          }

          if (content.includes('.transfer(') && !content.includes('safeTransfer')) {
            passed = false;
            details += `${contract} uses unsafe transfer\n`;
          }
        }

        return { passed, details: details || 'All contracts use SafeERC20' };
      },
    },
    {
      name: 'Input Validation',
      description: 'Check for require statements on function inputs',
      severity: 'high',
      check: async () => {
        const contracts = ['TaskManager.sol', 'TaskChainzToken.sol'];
        let passed = true;
        let details = '';

        for (const contract of contracts) {
          const content = fs.readFileSync(
            path.join(__dirname, '..', 'contracts', contract),
            'utf8'
          );

          // Check for address(0) validation
          const functionMatches = content.match(/function\s+\w+\s*\([^)]*address[^)]*\)/g) || [];
          const hasZeroCheck = content.includes('address(0)');

          if (functionMatches.length > 0 && !hasZeroCheck) {
            details += `${contract} may be missing address(0) checks\n`;
          }
        }

        return { passed: details === '', details: details || 'Input validation present' };
      },
    },
    {
      name: 'Event Emission',
      description: 'Check that state changes emit events',
      severity: 'medium',
      check: async () => {
        const contracts = ['TaskManager.sol', 'Gamification.sol'];
        let passed = true;
        let details = '';

        for (const contract of contracts) {
          const content = fs.readFileSync(
            path.join(__dirname, '..', 'contracts', contract),
            'utf8'
          );

          if (!content.includes('emit ')) {
            passed = false;
            details += `${contract} missing event emissions\n`;
          }
        }

        return { passed, details: details || 'Events emitted for state changes' };
      },
    },
    {
      name: 'Pausable',
      description: 'Check for emergency pause functionality',
      severity: 'medium',
      check: async () => {
        const contracts = ['TaskChainzToken.sol', 'TaskManager.sol'];
        let passed = true;
        let details = '';

        for (const contract of contracts) {
          const content = fs.readFileSync(
            path.join(__dirname, '..', 'contracts', contract),
            'utf8'
          );

          if (!content.includes('Pausable')) {
            passed = false;
            details += `${contract} missing Pausable\n`;
          }
        }

        return { passed, details: details || 'Emergency pause available' };
      },
    },
    {
      name: 'No tx.origin',
      description: 'Check that tx.origin is not used for authentication',
      severity: 'high',
      check: async () => {
        const contractsDir = path.join(__dirname, '..', 'contracts');
        const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.sol'));
        let passed = true;
        let details = '';

        for (const file of files) {
          const content = fs.readFileSync(path.join(contractsDir, file), 'utf8');

          if (content.includes('tx.origin')) {
            passed = false;
            details += `${file} uses tx.origin (phishing vulnerability)\n`;
          }
        }

        return { passed, details: details || 'No tx.origin usage found' };
      },
    },
    {
      name: 'Integer Overflow Protection',
      description: 'Check for Solidity 0.8+ or SafeMath usage',
      severity: 'critical',
      check: async () => {
        const contractsDir = path.join(__dirname, '..', 'contracts');
        const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.sol'));
        let passed = true;
        let details = '';

        for (const file of files) {
          const content = fs.readFileSync(path.join(contractsDir, file), 'utf8');

          const versionMatch = content.match(/pragma solidity \^?(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            const version = versionMatch[1];
            const [major, minor] = version.split('.').map(Number);

            if (major === 0 && minor < 8) {
              if (!content.includes('SafeMath')) {
                passed = false;
                details += `${file} uses Solidity <0.8 without SafeMath\n`;
              }
            }
          }
        }

        return { passed, details: details || 'All contracts use Solidity 0.8+ (built-in overflow protection)' };
      },
    },
  ];

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let passedCount = 0;

  for (const check of checks) {
    const result = await check.check();
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const severityColor = {
      critical: '\x1b[31m',
      high: '\x1b[91m',
      medium: '\x1b[33m',
      low: '\x1b[36m',
      info: '\x1b[37m',
    }[check.severity];

    console.log(`${status} [${severityColor}${check.severity.toUpperCase()}\x1b[0m] ${check.name}`);
    console.log(`   ${check.description}`);
    console.log(`   Details: ${result.details}\n`);

    if (result.passed) {
      passedCount++;
    } else {
      if (check.severity === 'critical') criticalCount++;
      else if (check.severity === 'high') highCount++;
      else if (check.severity === 'medium') mediumCount++;
    }
  }

  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Passed: ${passedCount}/${checks.length}`);
  console.log(`   Critical Issues: ${criticalCount}`);
  console.log(`   High Issues: ${highCount}`);
  console.log(`   Medium Issues: ${mediumCount}`);

  if (criticalCount > 0 || highCount > 0) {
    console.log('\n⚠️  Critical or High severity issues found. Fix before deployment!');
    process.exit(1);
  } else {
    console.log('\n✅ Security checks passed!');
    process.exit(0);
  }
}

runSecurityChecks().catch(console.error);
