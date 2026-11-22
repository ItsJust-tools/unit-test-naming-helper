import type { ToolConfig } from '@itsjust/core';

const toolConfig = {
  id: 'unit-test-naming-helper',
  name: 'Unit Test Naming Helper',
  description:
    'Suggests clean, consistent unit test names from a description of the behavior being tested, following popular naming conventions (should, when/then, given, BDD and ARR), with batch mode, Jest/Vitest snippet export and copy-to-clipboard.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: false,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#0ea5e9',
    accentHover: '#0284c7',
    accentSubtle: 'rgba(14, 165, 233, 0.12)',
    brand: 'Unit Test Naming Helper',
    icon: '🧪',
  },
  shortcuts: [
    {
      title: 'Unit Test Naming Helper',
      shortcuts: [
        { keys: 'G', label: 'Generate', description: 'focus the behavior description input' },
        { keys: 'B', label: 'Batch mode', description: 'switch to the batch input panel' },
        {
          keys: 'Y',
          label: 'Copy name',
          description: 'copy the current test name to the clipboard',
        },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
