const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'types/database.ts');
let content = fs.readFileSync(target, 'utf8');

content = content.replace(`    Functions: {
      match_semantic_items: {
        Args: any;
        Returns: any;
      };
      [_ in never]: never;
    };`, `    Functions: {
      match_semantic_items: {
        Args: any;
        Returns: any;
      };
    };`);

// If it hasn't replaced for some reason due to whitespace differences, let's use a regex
content = content.replace(/\[_\s+in\s+never\]:\s+never;/g, '');

fs.writeFileSync(target, content);
console.log("Mapped type error fixed.");
