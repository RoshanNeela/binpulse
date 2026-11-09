import { useState } from 'react'
import { useFleet } from '../state/FleetContext.jsx'
import { PageHeader, Panel } from '../components/ui.jsx'
import { ZONES, GHATS, DENSITY, fillColor, streetViewUrl, mapsLink } from '../data/model.js'

// PS07 density bands laid left→right across the cross-section of the ghat (river on the left).
const BANDS = [
  { key: 'Red', x: 20, w: 19 },
  { key: 'Yellow', x: 39, w: 24 },
  { key: 'Green', x: 63, w: 37 },
]
// Ghat segments stacked along the Godavari (top→south), matching the PS07 ghat plan.
const SEG = [
  { name: 'Durgamma Ghat', code: 'G1', y0: 0, y1: 20 },
  { name: 'Godavari River Ghat', code: 'G3', y0: 20, y1: 39 },
  { name: 'Godavari Nitya Aarti', code: 'G4', y0: 39, y1: 55 },
  { name: 'Pushkar Ghat', code: 'G5', y0: 55, y1: 70 },
  { name: 'Padmavathi Ghat', code: 'G6', y0: 70, y1: 92 },
]
const RMC = [90, 86] // Resource Recovery Centre

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
      <g className="pin-label" transform={`translate(0 ${b.y < 18 ? 3 : -12.5})`}>
        {b.y < 18 ? (
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

// Live Google Street View of a ghat's riverfront point (keyless embed).
function StreetView({ ghat, onPick }) {
  const g = GHATS[ghat]
  return (
    <div className="mapwrap mapwrap-static">
      <div className="svchips">
        {ZONES.map((z) => (
          <button key={z} className={`chip ${ghat === z ? 'on' : ''}`} onClick={() => onPick(z)}>
            {GHATS[z].code} · {GHATS[z].short}
          </button>
        ))}
      </div>
      <iframe
        key={ghat}
        title={`Street View — ${ghat}`}
        className="svframe"
        src={streetViewUrl(g.lat, g.lng, g.heading)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="maplegend">
        <span><span className="dot" style={{ background: DENSITY.Red.color }} />{g.code} · {ghat}</span>
        <span className="sep" />
        <a className="svlink" href={mapsLink(g.lat, g.lng)} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>
      </div>
      <div className="svnote">Live Google Street View · imagery © Google · point is illustrative, verify with GIS survey</div>
    </div>
  )
}

export default function LiveMap({ openBin }) {
  const { fleet } = useFleet()
  const [zone, setZone] = useState('all')
  const [view, setView] = useState('map')
  const [svGhat, setSvGhat] = useState('Pushkar Ghat')
  const inZone = (b) => zone === 'all' || b.zone === zone
  const shown = fleet.filter(inZone)
  const priority = [...shown].sort((a, b) => b.fill - a.fill)

  const openStreet = () => {
    if (zone !== 'all') setSvGhat(zone)
    setView('street')
  }
  const pickGhat = (z) => { setSvGhat(z); setZone(z) }

  return (
    <>
      <PageHeader
        title="Live Map"
        sub="Godavari riverfront · Rajamahendravaram · markers by fill level, bands by PS07 crowd-density zone"
        actions={
          <>
            <div className="segbar">
              <button className={`chip ${view === 'map' ? 'on' : ''}`} onClick={() => setView('map')}>Map</button>
              <button className={`chip ${view === 'street' ? 'on' : ''}`} onClick={openStreet}>Street View</button>
            </div>
            <select className="sel" value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="all">All ghats</option>
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </>
        }
      />
      <div className="cols-side">
        {view === 'street' ? (
          <StreetView ghat={svGhat} onPick={pickGhat} />
        ) : (
        <div className="mapwrap mapwrap-static">
          <svg viewBox="0 0 100 92">
            <defs>
              <linearGradient id="mp-land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--surface-2)" />
                <stop offset="1" stopColor="var(--surface)" />
              </linearGradient>
              <linearGradient id="mp-river" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#3f8fba" />
                <stop offset="1" stopColor="#5ea8cf" />
              </linearGradient>
            </defs>

            {/* land */}
            <rect x="0" y="0" width="100" height="92" fill="url(#mp-land)" />

            {/* density bands (PS07 Red / Yellow / Green) */}
            {BANDS.map((bd) => (
              <g key={bd.key}>
                <rect x={bd.x} y="0" width={bd.w} height="92" fill={DENSITY[bd.key].color} opacity="0.07" />
                <rect x={bd.x} y="0" width="0.4" height="92" fill={DENSITY[bd.key].color} opacity="0.3" />
                <text x={bd.x + 1.6} y="90" fontSize="2.3" fontWeight="800" letterSpacing="0.2"
                  fill={DENSITY[bd.key].color} opacity="0.8">
                  {DENSITY[bd.key].label.toUpperCase()} · {DENSITY[bd.key].spacing}
                </text>
              </g>
            ))}

            {/* Godavari river (flows top → south, west bank) */}
            <path d="M-4 -4 V96 L19 96 Q 23 80 19.5 64 Q 16.5 48 20 32 Q 23.5 18 18 -4 Z" fill="url(#mp-river)" opacity=".55" />
            <path d="M14 -4 Q 11 24 15 48 Q 18 72 12 96" fill="none" stroke="#fff" strokeWidth="0.5" opacity=".35" />
            <path d="M7 -4 Q 5 26 9 50 Q 12 74 6 96" fill="none" stroke="#fff" strokeWidth="0.4" opacity=".22" />
            <text x="8" y="50" fontSize="2.8" fill="#2b6b8c" fontWeight="800" opacity=".8"
              transform="rotate(-90 8 50)" letterSpacing="0.6">GODAVARI RIVER</text>

            {/* ghat segments: divider + ghat marker on the bank + access road + label */}
            {SEG.map((s, i) => {
              const mid = (s.y0 + s.y1) / 2
              const active = zone === 'all' || zone === s.name
              return (
                <g key={s.code} opacity={active ? 1 : 0.5}>
                  {/* promenade / steps at the water's edge */}
                  {[0, 1, 2, 3].map((k) => (
                    <line key={k} x1="16.5" y1={mid - 3 + k * 2} x2="20" y2={mid - 3 + k * 2}
                      stroke="var(--border)" strokeWidth="0.5" opacity=".6" />
                  ))}
                  {/* access road (entry/exit) inland */}
                  <path d={`M20 ${mid} H98`} fill="none" stroke="var(--border)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d={`M20 ${mid} H98`} fill="none" stroke="var(--surface)" strokeWidth="1.1" strokeLinecap="round" />
                  {/* ghat flame / aarti marker */}
                  <g transform={`translate(19 ${mid})`}>
                    <circle r="2.1" fill="var(--crit)" stroke="#fff" strokeWidth="0.5" />
                    <path d="M0 -1.1 Q 0.9 0 0 1 Q -0.9 0 0 -1.1 Z" fill="#fff" />
                  </g>
                  {/* ghat label chip */}
                  <g transform={`translate(21 ${s.y0 + 2})`}>
                    <rect x="0" y="0" width={GHATS[s.name].short.length * 1.5 + 10} height="5.4" rx="2.6"
                      fill="var(--surface)" stroke="var(--border)" strokeWidth="0.4" opacity=".95" />
                    <text x="2.6" y="3.7" fontSize="2.8" fontWeight="800" fill="var(--muted)">
                      <tspan fill="var(--accent-2)">{s.code}</tspan> · {GHATS[s.name].short}
                    </text>
                  </g>
                  {/* segment divider */}
                  {i < SEG.length - 1 && (
                    <line x1="18" y1={s.y1} x2="100" y2={s.y1} stroke="var(--border)" strokeWidth="0.3" strokeDasharray="1.4 1.6" opacity=".55" />
                  )}
                </g>
              )
            })}

            {/* Resource Recovery Centre (RMC) */}
            <g transform={`translate(${RMC[0]} ${RMC[1]})`}>
              <rect x="-3.6" y="-3.8" width="7.2" height="5.2" rx="1" fill="var(--accent-2)" stroke="#fff" strokeWidth="0.6" />
              <path d="M-4 -3.8 L0 -6.3 L4 -3.8 Z" fill="var(--accent)" stroke="#fff" strokeWidth="0.5" />
              <rect x="-1" y="-1.8" width="2" height="3.2" rx="0.3" fill="#fff" opacity=".85" />
              <text y="4.6" textAnchor="middle" fontSize="2.8" fontWeight="700" fill="var(--muted)">RMC</text>
            </g>

            {/* animated bin markers */}
            {fleet.map((b) => <MapBin key={b.id} b={b} dim={!inZone(b)} onClick={() => openBin(b.id)} />)}

            {/* compass */}
            <g transform="translate(93 9)">
              <circle r="5.4" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.6" opacity=".95" />
              <path d="M0 -4 L1.8 1 L0 -0.4 L-1.8 1 Z" fill="var(--crit)" />
              <text y="-4.6" textAnchor="middle" fontSize="2.8" fontWeight="700" fill="var(--muted)">N</text>
            </g>
            {/* scale bar */}
            <g transform="translate(70 70)">
              <line x1="0" y1="0" x2="18" y2="0" stroke="var(--fg)" strokeWidth="0.8" />
              <line x1="0" y1="-1.4" x2="0" y2="1.4" stroke="var(--fg)" strokeWidth="0.8" />
              <line x1="18" y1="-1.4" x2="18" y2="1.4" stroke="var(--fg)" strokeWidth="0.8" />
              <text x="9" y="-2.2" textAnchor="middle" fontSize="3" fill="var(--muted)" fontWeight="600">200 m</text>
            </g>
          </svg>

          <div className="maplegend">
            {[['Available', 'var(--ok)'], ['Almost', 'var(--warn)'], ['Full', 'var(--crit)']].map((l) => (
              <span key={l[0]}><span className="dot" style={{ background: l[1] }} />{l[0]}</span>
            ))}
            <span className="sep" />
            <span><span className="dot" style={{ background: 'var(--accent-2)' }} />RMC</span>
          </div>
          <div className="svnote">Preliminary ghat grid — verify dimensions and boundaries with georeferenced GIS/survey data (PS07)</div>
        </div>
        )}

        <Panel title="Priority List" hint="fullest first">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 520, overflowY: 'auto' }}>
            {priority.map((b) => (
              <button key={b.id} className="navitem" style={{ color: 'var(--fg)' }} onClick={() => openBin(b.id)}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: fillColor(b.fill), flex: 'none' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{b.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {b.id} · {b.sector}
                    <span style={{ color: DENSITY[b.density].color, fontWeight: 700 }}> · {DENSITY[b.density].label}</span>
                  </span>
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
