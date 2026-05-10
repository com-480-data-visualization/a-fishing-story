import { useState, useRef, useEffect } from 'react'
import { getCountryName, getRealCountryCodes } from '../data/countryNames'
import metaJson from '../data/meta.json'

const COUNTRIES = getRealCountryCodes(metaJson.flags)

interface FlagPickerProps {
  selectedFlag: string | null
  onSelect: (flag: string | null) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function FlagPicker({ selectedFlag, onSelect, open, onOpenChange }: FlagPickerProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  const filtered = search.trim()
    ? COUNTRIES.filter(c => getCountryName(c).toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES

  const isActive = selectedFlag !== null

  return (
    <>
      <button
        onClick={() => onOpenChange(!open)}
        title={isActive ? `Filtered: ${getCountryName(selectedFlag!)}` : 'Filter by country'}
        style={{
          position: 'absolute', top: 72, right: 20,
          width: 44, height: 44,
          background: isActive ? 'rgba(99,179,255,0.2)' : 'rgba(10,14,18,0.6)',
          color: isActive ? '#63b3ff' : 'white',
          border: isActive ? '1px solid rgba(99,179,255,0.5)' : '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20,
        }}
      >
        {/* Flagpole + flag rectangle — universally understood as "country" */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="3" y="1" width="1.5" height="16" rx="0.75" />
          <rect x="4.5" y="1.5" width="10" height="7" rx="1" opacity={isActive ? 1 : 0.75} />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 124, right: 20,
          width: 240,
          background: 'rgba(10,14,18,0.92)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          backdropFilter: 'blur(12px)',
          zIndex: 25,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6, padding: '6px 10px',
                color: 'white', fontSize: 13, outline: 'none',
              }}
            />
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            <div
              onClick={() => { onSelect(null); onOpenChange(false) }}
              style={{
                padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                color: selectedFlag === null ? '#63b3ff' : 'rgba(255,255,255,0.7)',
                background: selectedFlag === null ? 'rgba(99,179,255,0.1)' : 'transparent',
                fontWeight: selectedFlag === null ? 600 : 400,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              All countries
            </div>

            {filtered.map(code => {
              const name = getCountryName(code)
              const active = selectedFlag === code
              return (
                <div
                  key={code}
                  onClick={() => { onSelect(code); onOpenChange(false) }}
                  style={{
                    padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                    color: active ? '#63b3ff' : 'rgba(255,255,255,0.75)',
                    background: active ? 'rgba(99,179,255,0.1)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>{name}</span>
                  <span style={{ fontSize: 11, opacity: 0.4 }}>{code}</span>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
