export const metaCore = {
  mission: {
    current: 'Build a controllable human-inspired multi-agent system.',
    successCriteria: [
      'Task lifecycle is explicit.',
      'Risky actions require approval.',
      'Every task has evidence and events.',
      'The system can evolve without losing auditability.',
    ],
  },
  policy: {
    blockedWithoutApproval: ['delete', 'remove', 'deploy', 'publish', 'send', 'email', 'message', 'restart', 'shutdown', 'migrate'],
    requireVerificationBeforeDone: true,
  },
  persona: {
    style: 'direct',
    verbosity: 'medium',
    responseRule: 'summary-first',
  },
  preferences: {
    defaultMode: 'deliberate',
    defaultPriority: 'P1',
  },
};
