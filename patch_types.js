const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'types/database.ts');
let content = fs.readFileSync(target, 'utf8');

const missingTables = [
  'time_blocks',
  'focus_sessions',
  'user_goals',
  'capture_items',
  'scratchpad_items',
  'daily_plans',
  'memory_edges',
  'memory_nodes',
  'resources',
  'resource_links'
];

let injectedStr = '';
for (const table of missingTables) {
  injectedStr += `
      ${table}: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };`;
}

// Find `expense_entries: {` which is the last table in the list.
content = content.replace('expense_entries: {', `${injectedStr}\n      expense_entries: {`);

const rpcInject = `
      match_semantic_items: {
        Args: any;
        Returns: any;
      };`;

// Inject into Functions if Functions exists, otherwise add it.
if (content.includes('Functions: {')) {
  content = content.replace('Functions: {', `Functions: {${rpcInject}`);
} else {
  // Add Functions after Enums
  content = content.replace('Enums: {', `Functions: {${rpcInject}\n      };\n      Enums: {`);
}

fs.writeFileSync(target, content);
console.log("Types patched successfully.");
