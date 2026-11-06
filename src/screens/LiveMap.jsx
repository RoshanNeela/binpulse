import { useState } from 'react'
import { useFleet } from '../state/FleetContext.jsx'
import { PageHeader, Panel } from '../components/ui.jsx'
import { ZONES, fillColor, colorFor } from '../data/model.js'

const ZONEBOX = {
  Central: [32, 34, 36, 32], North: [18, 6, 64, 24], East: [62, 30, 34, 38],
  South: [20, 66, 46, 30], West: [4, 30, 26, 38],
}
// layered roads: wide casing + lighter surface drawn on top
const ROADS = [
  { d: 'M0 46 H100', w: 5.4 }, { d: 'M50 0 V92', w: 5.4 },
  { d: 'M0 22 H100', w: 3 }, { d: 'M0 70 H100', w: 3 },
  { d: 'M24 0 V92', w: 3 }, { d: 'M76 0 V92', w: 3 },
  { d: 'M50 46 L94 10', w: 3 },
]
// building blocks for city texture [x,y,w,h]
const BLOCKS = [
  [4, 24, 16, 18], [4, 48, 16, 18], [28, 2, 18, 16], [54, 2, 18, 16],
  [54, 26, 18, 16], [80, 26, 16, 16], [28, 50, 18, 16], [54, 50, 18, 16],
  [28, 74, 18, 14], [54, 74, 18, 14],
]
const DEPOT = [8, 84]

// an animated waste bin placed on the map: contents fill to the live level,
// the surface wobbles and the lid bobs (lid flips open when full)
function MapBin({ b, dim, onClick }) {
  const c = fillColor(b.fill)
  const uid = 'mb-' + b.id
  const full = b.fill >= 80
  const interiorTop = 34, interiorBot = 108
  const offset = (1 - Math.min(100, b.fill) / 100) * (interiorBot - interiorTop)
  const lidColor = b.type === 'Recycling' ? 'var(--accent)' : b.type === 'Organic' ? 'var(--ok)' : 'var(--surface)'
  return (
    <g className={`pin mapbin${full ? ' is-full' : ''}`} opacity={dim ? 0.28 : 1}
      transform={`translate(${b.x} ${b.y})`} tabIndex={0} role="button"
      aria-label={`${b.name}, ${b.fill}% full`}
      onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}>
      <ellipse cx="0" cy="0.6" rx="3.4" ry="1.2" fill="#000" opacity=".2" />
      <g className="mapbin-body" transform="scale(0.12) translate(-50 -108)">
        <defs>
          <clipPath id={uid}><path d="M26 34 H74 L71 108 H29 Z" /></clipPath>
          <linearGradient id={uid + 'g'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c} stopOpacity="0.95" />
            <stop offset="1" stopColor={c} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path d="M26 34 H74 L71 108 H29 Z" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1.6" />
        <g clipPath={`url(#${uid})`}>
          <g className="bin-fill" style={{ transform: `translateY(${offset}px)` }}>
            <rect x="18" y="34" width="64" height="92" fill={`url(#${uid}g)`} />
            <path className="bin-wave" fill={c} fillOpacity="0.9"
              d="M-20 34 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V60 H-20 Z" />
            <path className="bin-wave bin-wave2" fill={c} fillOpacity="0.5"
              d="M-20 35 q10 4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V60 H-20 Z" />
          </g>
        </g>
        <path d="M26 34 H74 L71 108 H29 Z" fill="none" stroke="var(--border)" strokeWidth="1.6" />
        <line x1="42" y1="38" x2="41" y2="105" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
        <line x1="58" y1="38" x2="59" y2="105" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
        <g className="bin-lid">
          <rect x="22" y="24" width="56" height="8" rx="3" fill={lidColor} stroke="var(--border)" strokeWidth="1.6" />
          <rect x="43" y="18" width="14" height="7" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.6" />
        </g>
      </g>
      {b.isReal && <circle cx="0" cy="-5.5" r="7.5" fill="none" stroke={c} strokeWidth="0.6" strokeDasharray="1.6 1.6" opacity=".8" />}
      <g className="pin-label" transform={`translate(0 ${b.y < 24 ? 3 : -12.5})`}>
        {b.y < 24 ? (
          <>
            <path d="M-1.7 -0.4 L0 -2.3 L1.7 -0.4 Z" fill="var(--fg)" />
            <rect x="-13" y="-0.4" width="26" height="6.4" rx="2.2" fill="var(--fg)" />
            <text x="0" y="4" textAnchor="middle" fontSize="2.8" fontWeight="700" fill="var(--surface)">{b.id} · {b.fill}%</text>
          </>
        ) : (
          <>
            <rect x="-13" y="-6" width="26" height="6.4" rx="2.2" fill="var(--fg)" />
            <path d="M-1.7 0.4 L0 2.3 L1.7 0.4 Z" fill="var(--fg)" />
            <text x="0" y="-1.6" textAnchor="middle" fontSize="2.8" fontWeight="700" fill="var(--surface)">{b.id} · {b.fill}%</text>
          </>
        )}
      </g>
    </g>
  )
}

export default function LiveMap({ openBin }) {
  const { fleet } = useFleet()
  const [zone, setZone] = useState('all')
  const inZone = (b) => zone === 'all' || b.zone === zone
  const shown = fleet.filter(inZone)
  const priority = [...shown].sort((a, b) => b.fill - a.fill)
  return (
    <>
      <PageHeader
        title="Live Map"
        sub="City-wide collection network · markers color-coded by fill level"
        actions={
          <select className="sel" value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="all">All zones</option>
            {ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        }
      />
      <div className="cols-side">
        <div className="mapwrap mapwrap-static">
          <svg viewBox="0 0 100 92">
            <defs>
              <linearGradient id="mp-land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--surface-2)" />
                <stop offset="1" stopColor="var(--surface)" />
              </linearGradient>
            </defs>

            {/* land */}
            <rect x="0" y="0" width="100" height="92" fill="url(#mp-land)" />

            {/* river + lake */}
            <path d="M-3 13 Q 28 23 52 17 T 103 30 L103 36 Q 60 25 40 31 Q 18 37 -3 20 Z"
              fill="#5ea8cf" opacity=".45" />
            <ellipse cx="86" cy="80" rx="12" ry="8" fill="#5ea8cf" opacity=".45" />

            {/* parks */}
            <ellipse cx="18" cy="64" rx="10" ry="8" fill="var(--ok)" opacity=".16" />
            <ellipse cx="88" cy="48" rx="7" ry="9" fill="var(--ok)" opacity=".16" />

            {/* building blocks */}
            {BLOCKS.map((r, i) => (
              <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx="1.4"
                fill="var(--surface)" stroke="var(--border)" strokeWidth="0.4" opacity=".55" />
            ))}

            {/* roads: casing then surface */}
            {ROADS.map((r, i) => <path key={'c' + i} d={r.d} fill="none" stroke="var(--border)" strokeWidth={r.w} strokeLinecap="round" />)}
            {ROADS.map((r, i) => <path key={'s' + i} d={r.d} fill="none" stroke="var(--surface)" strokeWidth={r.w - 1.6} strokeLinecap="round" />)}

            {/* street names */}
            <text x="51.4" y="60" fontSize="2.3" fill="var(--muted)" opacity=".7" fontWeight="600" transform="rotate(90 51.4 60)">CENTRAL AVE</text>
            <text x="64" y="44.4" fontSize="2.3" fill="var(--muted)" opacity=".7" fontWeight="600">MARKET ST</text>

            {/* neighborhood labels */}
            {Object.entries(ZONEBOX).map(([z, r]) => {
              const active = inZone({ zone: z })
              return (
                <text key={z} x={r[0] + r[2] / 2} y={r[1] + 4.5} textAnchor="middle" fontSize="3"
                  fill="var(--muted)" fontWeight="700" opacity={active ? 0.5 : 0.25} letterSpacing="0.3">
                  {z.toUpperCase()}
                </text>
              )
            })}

            {/* depot */}
            <g transform={`translate(${DEPOT[0]} ${DEPOT[1]})`}>
              <rect x="-3.4" y="-3.8" width="6.8" height="5.2" rx="1" fill="var(--accent-2)" stroke="#fff" strokeWidth="0.6" />
              <path d="M-3.9 -3.8 L0 -6.3 L3.9 -3.8 Z" fill="var(--accent)" stroke="#fff" strokeWidth="0.5" />
              <rect x="-1" y="-1.8" width="2" height="3.2" rx="0.3" fill="#fff" opacity=".85" />
              <text y="5" textAnchor="middle" fontSize="3" fontWeight="700" fill="var(--muted)">DEPOT</text>
            </g>

            {/* animated bin markers */}
            {fleet.map((b) => <MapBin key={b.id} b={b} dim={!inZone(b)} onClick={() => openBin(b.id)} />)}

            {/* compass */}
            <g transform="translate(92 9)">
              <circle r="5.4" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.6" opacity=".95" />
              <path d="M0 -4 L1.8 1 L0 -0.4 L-1.8 1 Z" fill="var(--crit)" />
              <text y="-4.6" textAnchor="middle" fontSize="2.8" fontWeight="700" fill="var(--muted)">N</text>
            </g>
            {/* scale bar */}
            <g transform="translate(70 87)">
              <line x1="0" y1="0" x2="20" y2="0" stroke="var(--fg)" strokeWidth="0.8" />
              <line x1="0" y1="-1.4" x2="0" y2="1.4" stroke="var(--fg)" strokeWidth="0.8" />
              <line x1="20" y1="-1.4" x2="20" y2="1.4" stroke="var(--fg)" strokeWidth="0.8" />
              <text x="10" y="-2.2" textAnchor="middle" fontSize="3" fill="var(--muted)" fontWeight="600">2 km</text>
            </g>
          </svg>

          <div className="maplegend">
            {[['Available', 'var(--ok)'], ['Almost', 'var(--warn)'], ['Full', 'var(--crit)']].map((l) => (
              <span key={l[0]}><span className="dot" style={{ background: l[1] }} />{l[0]}</span>
            ))}
            <span className="sep" />
            <span><span className="dot" style={{ background: 'var(--accent-2)' }} />Depot</span>
          </div>
        </div>

        <Panel title="Priority List" hint="fullest first">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 520, overflowY: 'auto' }}>
            {priority.map((b) => (
              <button key={b.id} className="navitem" style={{ color: 'var(--fg)' }} onClick={() => openBin(b.id)}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: fillColor(b.fill), flex: 'none' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{b.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{b.id} · {b.zone}</span>
                </span>
                <b style={{ marginLeft: 'auto', color: fillColor(b.fill) }}>{b.fill}%</b>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}
