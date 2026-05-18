import { useState, useRef, useEffect } from 'react'
import { getCountryName, getRealCountryCodes } from '../data/countryNames'
import metaJson from '../data/meta.json'
import { theme } from '../theme'

const COUNTRIES = getRealCountryCodes(metaJson.flags)

interface FlagPickerProps {
  selectedFlag: string | null
  onSelect: (flag: string | null) => void
  open: boolean
  onClose: () => void
}

/**
 * Searchable country-filter dropdown. Rendered as a popover anchored under the
 * country button in MapControls; the button itself lives in MapControls.
 */
export default function FlagPicker({ selectedFlag, onSelect, open, onClose }: FlagPickerProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  if (!open) return null

  const filtered = search.trim()
    ? COUNTRIES.filter(c => getCountryName(c).toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES

  const choose = (flag: string | null) => {
    onSelect(flag)
    onClose()
  }

  return (
    <div style={{
      position: 'absolute', top: 72, right: 20,
      width: 240,
      background: theme.panelBg,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      backdropFilter: 'blur(12px)',
      zIndex: 25,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: theme.shadowPanel,
    }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.borderSubtle}` }}>
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search country..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: theme.inputBg,
            border: `1px solid ${theme.border}`,
            borderRadius: 6, padding: '6px 10px',
            color: theme.textPrimary, fontSize: 13, outline: 'none',
          }}
        />
      </div>

      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        <div
          onClick={() => choose(null)}
          style={{
            padding: '8px 14px', cursor: 'pointer', fontSize: 13,
            color: selectedFlag === null ? theme.accent : theme.textSecondary,
            background: selectedFlag === null ? theme.accentBg : 'transparent',
            fontWeight: selectedFlag === null ? 600 : 400,
            borderBottom: `1px solid ${theme.borderSubtle}`,
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
              onClick={() => choose(code)}
              style={{
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                color: active ? theme.accent : theme.textSecondary,
                background: active ? theme.accentBg : 'transparent',
                fontWeight: active ? 600 : 400,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>{name}</span>
              <span style={{ fontSize: 11, color: theme.textFaint }}>{code}</span>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '12px 14px', fontSize: 13, color: theme.textMuted }}>
            No results
          </div>
        )}
      </div>
    </div>
  )
}
