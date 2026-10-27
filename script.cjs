const fs = require('fs');
const file = 'src/screens/GameScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove DiscussionTimer definition
content = content.replace(/function DiscussionTimer\(\) \{[\s\S]*?^  \)\n\}\n/m, '');

// 2. Remove <DiscussionTimer />
content = content.replace(/\{\/\* Discussion Timer \*\/\}\s*<DiscussionTimer \/>\s*/m, '');

// 3. Remove EliminateSheet definition
content = content.replace(/function EliminateSheet\([\s\S]*?^  \)\n\}\n/m, '');

// 4. Import EliminateDialog
content = content.replace(/import \{ getAvatarByIndex \} from '\.\.\/data\/avatars'/, "import { getAvatarByIndex } from '../data/avatars'\nimport { EliminateDialog } from '../components/EliminateDialog'");

// 5. Replace EliminateSheet usage
content = content.replace(/<EliminateSheet/g, '<EliminateDialog');

// 6. Add SuspenseSplash definition before GameScreen
const splashCode = `
function SuspenseSplash() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center px-6"
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: '#ef4444', marginBottom: 12 }}>
          HÃY CẨN THẬN...
        </h1>
        <p className="text-slate-300 text-lg font-medium">
          Gián điệp đang ở ngay bên cạnh bạn
        </p>
      </motion.div>
    </motion.div>
  )
}

export function GameScreen() {`;
content = content.replace(/export function GameScreen\(\) \{/, splashCode);

// 7. Add splash state and effect to GameScreen
const stateHook = `  const { players, eliminatePlayer, speakingOrder } = useGameStore()
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(t)
  }, [])`;
content = content.replace(/  const \{ players, eliminatePlayer, speakingOrder \} = useGameStore\(\)\n  const \[pendingPlayer, setPendingPlayer\] = useState<Player \| null>\(null\)/, stateHook);

// 8. Add AnimatePresence with splash
const splashJSX = `    <>
      <AnimatePresence mode="wait">
        {showSplash && <SuspenseSplash key="splash" />}
      </AnimatePresence>`;
content = content.replace(/    <>/, splashJSX);

fs.writeFileSync(file, content);
console.log('Done!');
