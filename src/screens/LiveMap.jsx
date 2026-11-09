import { useState } from 'react'
import { useFleet } from '../state/FleetContext.jsx'
import { PageHeader, Panel } from '../components/ui.jsx'
import {
  ZONES, GHATS, DENSITY, GHAT_CENTER,
  fillColor, streetViewUrl, mapEmbedUrl, mapsLink,
} from '../data/model.js'

// Ghat picker: "All ghats" overview + one chip per ghat. Drives both Map and Street View.
function GhatChips({ zone, setZone, all = true }) {
  return (
    <div className="svchips">
      {all && (
        <button className={`chip ${zone === 'all' ? 'on' : ''}`} onClick={() => setZone('all')}>All ghats</button>
      )}
      {ZONES.map((z) => (
        <button key={z} className={`chip ${zone === z ? 'on' : ''}`} onClick={() => setZone(z)}>
          {GHATS[z].code} · {GHATS[z].short}
        </button>
      ))}
    </div>
  )
}

// Real Google Map of the Godavari riverfront (keyless embed), centred on the selected ghat.
function GhatMap({ zone, setZone }) {
  const sel = zone === 'all' ? null : GHATS[zone]
  const lat = sel ? sel.lat : GHAT_CENTER.lat
  const lng = sel ? sel.lng : GHAT_CENTER.lng
  const z = sel ? 17 : 14
  return (
    <div className="mapwrap mapwrap-static">
      <GhatChips zone={zone} setZone={setZone} />
      <iframe
        key={zone}
        title={`Map — ${sel ? zone : 'Godavari riverfront'}`}
        className="svframe"
        src={mapEmbedUrl(lat, lng, z)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="maplegend">
        {Object.values(DENSITY).map((d) => (
          <span key={d.label}><span className="dot" style={{ background: d.color }} />{d.label} · {d.spacing}</span>
        ))}
        <span className="sep" />
        <a className="svlink" href={mapsLink(lat, lng)} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>
      </div>
      <div className="svnote">
        {sel ? `${sel.code} · ${zone}` : 'Rajamahendravaram riverfront'} · live Google Map · map data © Google · ghat points illustrative, verify with GIS survey
      </div>
    </div>
  )
}

// Live Google Street View of a ghat's riverfront point (keyless embed).
function StreetView({ zone, setZone }) {
  const ghat = zone === 'all' ? 'Pushkar Ghat' : zone
  const g = GHATS[ghat]
  return (
    <div className="mapwrap mapwrap-static">
      <GhatChips zone={zone === 'all' ? ghat : zone} setZone={setZone} all={false} />
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
  const inZone = (b) => zone === 'all' || b.zone === zone
  const shown = fleet.filter(inZone)
  const priority = [...shown].sort((a, b) => b.fill - a.fill)

  return (
    <>
      <PageHeader
        title="Live Map"
        sub="Godavari riverfront · Rajamahendravaram · live Google Map & Street View of the PS07 ghats"
        actions={
          <>
            <div className="segbar">
              <button className={`chip ${view === 'map' ? 'on' : ''}`} onClick={() => setView('map')}>Map</button>
              <button className={`chip ${view === 'street' ? 'on' : ''}`} onClick={() => setView('street')}>Street View</button>
            </div>
            <select className="sel" value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="all">All ghats</option>
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </>
        }
      />
      <div className="cols-side">
        {view === 'street'
          ? <StreetView zone={zone} setZone={setZone} />
          : <GhatMap zone={zone} setZone={setZone} />}

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
