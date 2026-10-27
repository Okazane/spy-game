const fs = require('fs');

// Fix GameScreen
let gs = fs.readFileSync('src/screens/GameScreen.tsx', 'utf8');
gs = gs.replace(/Skull, /, '');
gs = gs.replace(/Play, Pause, ArrowClockwise, Timer /, '');
gs = gs.replace(/playEliminateSound, /, '');
fs.writeFileSync('src/screens/GameScreen.tsx', gs);

// Fix RevealScreen
let rs = fs.readFileSync('src/screens/RevealScreen.tsx', 'utf8');
rs = rs.replace(/CheckCircle, /, '');
rs = rs.replace(/User, /, '');
fs.writeFileSync('src/screens/RevealScreen.tsx', rs);

console.log('Fixed');
