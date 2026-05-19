import { useState, useRef, useEffect } from 'react'
import { getCountryName, getRealCountryCodes } from '../data/countryNames'
import metaJson from '../data/meta.json'
import { theme } from '../theme'
import { FLAG_COLORS, MAX_FLAGS } from '../utils'

const COUNTRIES = getRealCountryCodes(metaJson.flags)

interface FlagPickerProps {
  selectedFlags: string[]
  onToggle: (flag: string) => void
  onClear: () => void
  open: boolean
}

/**
 * Searchable, multi-select country-filter dropdown. Up to MAX_FLAGS flags can
 * be selected; each selected flag is shown with the solid hue used to render
 * its layer on the map. Rendered as a popover anchored under the country
 * button in MapControls.
 */
export default function FlagPicker({ selectedFlags, onToggle, onClear, open }: FlagPickerProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  if (!open) return null

  const filtered = search.trim()
    ? COUNTRIES.filter(c => getCountryName(c).toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES

  const atLimit = selectedFlags.length >= MAX_FLAGS

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
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 7, fontSize: 11, color: theme.textMuted,
        }}>
          <span>{selectedFlags.length} / {MAX_FLAGS} selected</span>
          {selectedFlags.length > 0 && (
            <span
              onClick={onClear}
              style={{ cursor: 'pointer', color: theme.accent, fontWeight: 600 }}
            >
              Clear all
            </span>
          )}
        </div>
      </div>

      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {filtered.map(code => {
          const idx = selectedFlags.indexOf(code)
          const active = idx >= 0
          const disabled = !active && atLimit
          const rgb = active ? FLAG_COLORS[idx % FLAG_COLORS.length] : null
          return (
            <div
              key={code}
              onClick={() => { if (!disabled) onToggle(code) }}
              title={disabled ? `Limit of ${MAX_FLAGS} flags reached` : undefined}
              style={{
                padding: '7px 14px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 13,
                opacity: disabled ? 0.4 : 1,
                color: active ? theme.textPrimary : theme.textSecondary,
                background: active ? theme.accentBg : 'transparent',
                fontWeight: active ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{
                width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                border: `1px solid ${theme.border}`,
                background: rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : 'transparent',
              }} />
              <span style={{ flex: 1 }}>{getCountryName(code)}</span>
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
