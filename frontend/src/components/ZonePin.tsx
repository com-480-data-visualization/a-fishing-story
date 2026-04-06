import { useState } from 'react'
import type { Zone } from '../data/zones'

interface ZonePinProps {
  zone: Zone
  isSelected: boolean
  onZoneClick: (zone: Zone) => void
}

export default function ZonePin({ zone, isSelected, onZoneClick }: ZonePinProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onZoneClick(zone)}
      style={{ cursor: 'pointer', position: 'relative', width: 0, height: 0 }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0,
        transform: 'translate(-50%, -50%)',
        width: 40, height: 40, borderRadius: '50%',
        border: `2px solid ${zone.color}`,
        animation: 'zoneBeaconPulse 2.2s ease-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0,
        transform: 'translate(-50%, -50%)',
        width: 40, height: 40, borderRadius: '50%',
        border: `2px solid ${zone.color}`,
        animation: 'zoneBeaconPulse 2.2s ease-out infinite 0.8s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0,
        transform: `translate(-50%, -50%) scale(${hovered ? 1.5 : 1})`,
        width: isSelected ? 14 : 10,
        height: isSelected ? 14 : 10,
        borderRadius: '50%',
        background: zone.color,
        boxShadow: `0 0 ${isSelected ? 14 : 8}px ${zone.color}${isSelected ? 'cc' : '88'}`,
        transition: 'all 0.2s ease',
      }} />
      {(hovered || isSelected) && (
        <div style={{
          position: 'absolute',
          top: 14, left: 0,
          transform: 'translateX(-50%)',
          marginTop: 8,
          padding: '5px 12px',
          background: 'rgba(10,14,18,0.9)',
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 6,
          whiteSpace: 'nowrap',
          border: `1px solid ${zone.color}55`,
          backdropFilter: 'blur(6px)',
          pointerEvents: 'none',
          letterSpacing: '0.02em',
          zIndex: 30,
        }}>
          {zone.name}
        </div>
      )}
    </div>
  )
}
