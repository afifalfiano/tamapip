import { px } from '../constants/game'

const SECTIONS = [
  { title: '🐣 RAISING YOUR PET', lines: [
    'Name your pet when you first open the game. Leave blank for a random name.',
    'Your pet hatches from an egg and grows through 5 stages: Egg → Baby → Child → Teen → Adult.',
    'Growth takes real time — each stage takes hours, just like a real Tamagotchi.',
    'Your pet and all its progress are saved automatically in your browser.',
  ]},
  { title: '📊 STATS', lines: [
    '🍖 Hunger — feed your pet before it starves.',
    '😊 Happiness — play to keep spirits up.',
    '🧼 Cleanliness — clean up poop and dirt.',
    '⚡ Energy — let it sleep when tired.',
    '❤️ Health — drops when stats are neglected. Use medicine to heal.',
    'Stats decay slowly over time. They decay 70% slower while sleeping.',
    'Labels turn red/yellow when a stat is below 30 — act fast!',
  ]},
  { title: '🎮 ACTIONS', lines: [
    'Feed — restores hunger (+25). Cooldown: 3 ticks.',
    'Play — boosts happiness (+30), costs energy (-15). Cooldown: 3 ticks.',
    'Clean — restores cleanliness (+35), removes all poop. Cooldown: 3 ticks.',
    'Sleep — pet rests and slowly regens energy. Wakes automatically at 95.',
    'Medicine — restores health (+30). Cooldown: 5 ticks.',
    'Battle — unlocks at Child stage. Fight CPU opponents!',
    'Actions are locked while your pet is sleeping or critically sick (health < 30).',
  ]},
  { title: '⚔️ BATTLE', lines: [
    'Unlocks at Child stage. Fight CPU opponents to earn EXP.',
    'Attack — deal damage based on your attack stat.',
    'Defend — reduce incoming damage by 50% next turn.',
    'Special — powerful attack (1.5x damage). 3-turn cooldown — use wisely!',
    'Heal — restore 20 HP mid-battle.',
    'CPU opponents scale in difficulty with your pet\'s stage.',
    'Winning restores your pet\'s health to its battle HP.',
  ]},
  { title: '🏆 LEVELS & RANKS', lines: [
    'Win battles to earn EXP. EXP gained = 5 + (stage × 2).',
    'Every 10 EXP = 1 level. Higher level = stronger battle stats.',
    'Reach rank milestones for a title:',
    'Lv 1  🥉 ROOKIE',
    'Lv 5  🥈 FIGHTER',
    'Lv 10 🥇 VETERAN',
    'Lv 20 🏆 CHAMPION',
    'Lv 35 👑 LEGEND',
  ]},
  { title: '🐾 PET BEHAVIOUR', lines: [
    'Your pet wanders left and right on its own.',
    'If there are 3+ poops, it flees to the opposite side of the screen!',
    'When all stats are above 80, it spontaneously breaks into a happy dance 🕺',
    'Sick pets randomly sneeze — achoo!',
    'Click your pet to interact. It reacts based on its mood:',
    '  ♥  — happy (avg stats > 70)',
    '  !  — neutral (avg stats 40–70)',
    '  ... — sad (avg stats < 40)',
    'Spam-click 4 times and see what happens 😤',
  ]},
  { title: '💀 GAME OVER', lines: [
    'If health reaches 0, your pet dies.',
    'Average care stats below 25 cause health to decay each tick.',
    'Keep stats above 25 to stop the decay.',
    'Press RESTART to clear your save and start fresh with a new pet.',
  ]},
  { title: '💡 TIPS', lines: [
    'Put your pet to sleep overnight — stats decay 70% slower while sleeping.',
    'Clean poop quickly — 3+ poops cause your pet to flee and cleanliness tanks.',
    'A well-fed, happy, clean pet has stronger battle stats.',
    'Special attack is powerful but has a 3-turn cooldown — save it for the right moment.',
    'Check in every few hours, not every few minutes. It\'s a Tamagotchi!',
  ]},
]

export function HelpModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '380px',
          background: '#050f05', border: '2px solid #166534',
          padding: '16px', fontFamily: px, maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #14532d', paddingBottom: '8px' }}>
          <span style={{ fontSize: '9px', color: '#4ade80', letterSpacing: '3px' }}>MANUAL</span>
          <button onClick={onClose} style={{ fontFamily: px, fontSize: '8px', color: '#4ade80', background: 'transparent', border: '1px solid #166534', padding: '2px 6px', cursor: 'pointer' }}>✕</button>
        </div>
        {SECTIONS.map(({ title, lines }) => (
          <div key={title} style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '7px', color: '#4ade80', letterSpacing: '2px', marginBottom: '6px' }}>{title}</div>
            {lines.map((line, i) => (
              <div key={i} style={{ fontSize: '6px', color: '#86efac', lineHeight: '2', letterSpacing: '0.5px' }}>› {line}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
