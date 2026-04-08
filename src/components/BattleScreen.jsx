import { px } from '../constants/game'
import { ActionButton } from './ActionButton'
import { LogEntry } from './LogEntry'

function battleHpColor(hp, max) {
  const r = hp / max
  return r > 0.5 ? '#4ade80' : r > 0.25 ? '#facc15' : '#f87171'
}

function PetPanel({ name, battle, side }) {
  const hpColor = battleHpColor(battle.hp, battle.maxHp)
  const hpPct = Math.max(0, (battle.hp / battle.maxHp) * 100)
  return (
    <div style={{
      flex: 1, border: `2px solid ${side === 'player' ? '#4ade80' : '#f87171'}`,
      background: '#050f05', padding: '10px', boxShadow: 'none',
    }}>
      <div style={{ fontFamily: px, fontSize: '7px', color: side === 'player' ? '#4ade80' : '#f87171', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {side === 'player' ? '▶ ' : '◀ '}{name}
      </div>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: px, fontSize: '6px', color: hpColor, marginBottom: '3px' }}>
          <span>HP</span><span>{Math.floor(battle.hp)}/{battle.maxHp}</span>
        </div>
        <div style={{ background: '#1f2937', height: '6px', border: '1px solid #374151' }}>
          <div style={{ width: `${hpPct}%`, height: '100%', background: hpColor, transition: 'width 0.3s' }} />
        </div>
      </div>
      <div style={{ fontFamily: px, fontSize: '6px', color: '#6b7280', letterSpacing: '1px' }}>
        ATK {battle.attack} · DEF {battle.defense} · SPC {battle.special}
      </div>
    </div>
  )
}

export function BattleScreen({ playerPet, playerBattle, cpuBattle, isPlayerTurn, battleLog, onAction }) {
  const actions = [
    { key: 'attack',  icon: '⚔️', label: 'Attack',  cooldown: 0 },
    { key: 'defend',  icon: '🛡️', label: 'Defend',  cooldown: 0 },
    { key: 'special', icon: '✨', label: 'Special', cooldown: playerBattle?.specialCooldown ?? 0 },
    { key: 'heal',    icon: '💊', label: 'Heal',    cooldown: 0 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <PetPanel name={playerPet?.name ?? 'You'} battle={playerBattle} side="player" />
        <PetPanel name={cpuBattle?.name ?? 'CPU'} battle={cpuBattle} side="cpu" />
      </div>
      <div style={{ textAlign: 'center', fontFamily: px, fontSize: '7px', color: isPlayerTurn ? '#4ade80' : '#facc15', letterSpacing: '2px' }}>
        {isPlayerTurn ? '▶ YOUR TURN' : '⏳ ENEMY TURN...'}
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {actions.map(({ key, icon, label, cooldown }) => (
          <ActionButton key={key} icon={icon} label={label} disabled={!isPlayerTurn} cooldown={cooldown} onClick={() => onAction(key)} />
        ))}
      </div>
      <div style={{ border: '1px solid #14532d', background: '#020a02', padding: '8px', maxHeight: '110px', overflowY: 'auto' }}>
        {battleLog.length === 0
          ? <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#374151' }}>— battle started —</span>
          : battleLog.map((e, i) => <LogEntry key={i} message={e.message} type={e.type ?? 'info'} />)
        }
      </div>
    </div>
  )
}
