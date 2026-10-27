const fs = require('fs');
const file = 'src/screens/RevealScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove GameCard function
content = content.replace(/function GameCard\([\s\S]*?^  \)\n\}\n/m, '');

// 2. Add import
content = content.replace(/import \{ getAvatarByIndex, SPY_CODENAMES \} from '\.\.\/data\/avatars'/, "import { getAvatarByIndex, SPY_CODENAMES } from '../data/avatars'\nimport { GameCard } from '../components/GameCard'");

fs.writeFileSync(file, content);
console.log('Done!');
