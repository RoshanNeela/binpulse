import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { makeFleet, makeHistory, seedEvents, driftFleet, makeEvent, fleetStats, alertsList } from '../data/model.js'

const FleetContext = createContext(null)
export const useFleet = () => useContext(FleetContext)

const POLL_MS = 3000 // swap the tick body for real fetch('/api/status') calls at this interval

export function FleetProvider({ children }) {
  const [fleet, setFleet] = useState(makeFleet)
  const [events, setEvents] = useState(() => seedEvents(fleet))
  const [history, setHistory] = useState(makeHistory)
  const [acked, setAcked] = useState(() => new Set())
  const [dispatched, setDispatched] = useState(() => new Set())
  const [agentOnline, setAgentOnline] = useState(true)
  const [notif, setNotif] = useState({
    push: true, email: true, sms: false, whatsapp: true, webhook: false,
    full: true, fault: true, battery: true, offline: false, quiet: false,
  })
  const [toast, setToastState] = useState(null)
  const toastTimer = useRef(null)

  // live simulation loop (3s). Replace the body with backend polling to go live.
  useEffect(() => {
    const id = setInterval(() => {
      setFleet((prev) => {
        const next = driftFleet(prev)
        setHistory((h) => [...h.slice(1), { h: (h[h.length - 1].h + 1) % 24, avg: fleetStats(next).avg }])
        if (Math.random() > 0.4) setEvents((e) => [makeEvent(next), ...e].slice(0, 60))
        return next
      })
    }, POLL_MS)
    return () => clearInterval(id)
  }, [])

  const showToast = useCallback((msg) => {
    setToastState(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastState(null), 2200)
  }, [])

  const ack = useCallback((id) => setAcked((s) => new Set(s).add(id)), [])
  const ackAll = useCallback(() => setAcked(() => new Set(alertsList(fleet).map((a) => a.id))), [fleet])
  const dispatch = useCallback((id) => setDispatched((s) => new Set(s).add(id)), [])
  const resetBin = useCallback(() => {
    setFleet((prev) => prev.map((b, i) => (i === 0 ? { ...b, fill: 0, spark: [...b.spark.slice(-15), 0] } : b)))
  }, [])
  const toggleNotif = useCallback((k) => setNotif((n) => ({ ...n, [k]: !n[k] })), [])

  const value = {
    fleet, events, history, acked, dispatched, agentOnline, notif, toast,
    setAgentOnline, ack, ackAll, dispatch, resetBin, toggleNotif, showToast,
    stats: fleetStats(fleet),
    activeAlerts: alertsList(fleet).filter((a) => !acked.has(a.id)),
  }
  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>
}
