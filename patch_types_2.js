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

// Find `expense_entries: {` which is inside `Tables: {`
content = content.replace('      expense_entries: {', `${injectedStr}\n      expense_entries: {`);

const rpcInject = `
      match_semantic_items: {
        Args: any;
        Returns: any;
      };`;

content = content.replace('    Functions: {', `    Functions: {${rpcInject}`);

fs.writeFileSync(target, content);
console.log("Types patched correctly.");
