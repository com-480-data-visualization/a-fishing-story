import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/fishing_story_logo.jpg'

const NAVY = '#0D2D5E'
const BLUE = '#1565C0'
const AMBER = '#F59E0B'
const AMBER_DARK = '#D97706'

export default function Landing() {
  const navigate = useNavigate()
  const [btnHovered, setBtnHovered] = useState(false)

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50%       { transform: translateY(-14px) rotate(1deg); }
        }
        @keyframes waveSlide {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .landing-stat {
          animation: fadeUp 0.7s ease both;
        }
        .landing-stat:nth-child(1) { animation-delay: 0.45s; }
        .landing-stat:nth-child(2) { animation-delay: 0.6s;  }
        .landing-stat:nth-child(3) { animation-delay: 0.75s; }
      `}</style>

      <div style={{
        width: '100%',
        height: '100svh',
        background: 'linear-gradient(155deg, #EBF3FF 0%, #FFFFFF 45%, #FFFBF0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
      }}>

        {/* Background decorative blobs */}
        <div style={{
          position: 'absolute', top: -160, left: -160,
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21,101,192,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 60, right: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '8%',
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21,101,192,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Animated wave at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 110, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{ width: '200%', animation: 'waveSlide 18s linear infinite' }}>
            <svg viewBox="0 0 1440 110" preserveAspectRatio="none"
              style={{ width: '50%', height: 110, display: 'inline-block' }}>
              <path d="M0,55 C180,90 360,20 540,55 C720,90 900,20 1080,55 C1260,90 1380,50 1440,55 L1440,110 L0,110 Z"
                fill="rgba(21,101,192,0.07)" />
              <path d="M0,75 C200,45 400,95 600,70 C800,45 1000,90 1200,65 C1320,52 1400,72 1440,75 L1440,110 L0,110 Z"
                fill="rgba(21,101,192,0.05)" />
            </svg>
            <svg viewBox="0 0 1440 110" preserveAspectRatio="none"
              style={{ width: '50%', height: 110, display: 'inline-block' }}>
              <path d="M0,55 C180,90 360,20 540,55 C720,90 900,20 1080,55 C1260,90 1380,50 1440,55 L1440,110 L0,110 Z"
                fill="rgba(21,101,192,0.07)" />
              <path d="M0,75 C200,45 400,95 600,70 C800,45 1000,90 1200,65 C1320,52 1400,72 1440,75 L1440,110 L0,110 Z"
                fill="rgba(21,101,192,0.05)" />
            </svg>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', padding: '0 24px', gap: 0,
          animation: 'fadeUp 0.7s ease both',
        }}>

          {/* Logo */}
          <div style={{
            animation: 'floatLogo 5s ease-in-out infinite',
            marginBottom: 36,
          }}>
            <img
              src={logo}
              alt="A Fishing Story"
              style={{
                width: 148, height: 148,
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'center',
                boxShadow: `0 12px 40px rgba(13,45,94,0.18), 0 2px 10px rgba(0,0,0,0.08)`,
                border: '5px solid white',
                display: 'block',
              }}
            />
          </div>

          {/* Title */}
          <h1 style={{
            margin: 0,
            marginBottom: 14,
            fontSize: 'clamp(3rem, 8vw, 5.8rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
            background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 60%, #2196F3 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            A Fishing Story
          </h1>

          {/* Decorative line */}
          <div style={{
            width: 64, height: 4, borderRadius: 2, marginBottom: 22,
            background: `linear-gradient(90deg, ${AMBER}, ${AMBER_DARK})`,
          }} />

          {/* Subtitle */}
          <p style={{
            margin: 0,
            marginBottom: 44,
            fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
            color: '#5B7A9A',
            maxWidth: 460,
            lineHeight: 1.7,
          }}>
            Four years of global fishing vessel activity. Explore who fishes where,
            which waters they enter, and the patterns that define our oceans.
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 40, marginBottom: 50,
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {[
              { value: '4 years', label: 'of vessel data' },
              { value: 'Global', label: 'ocean coverage' },
              { value: '60 months', label: 'of observations' },
            ].map(stat => (
              <div key={stat.label} className="landing-stat" style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.45rem', fontWeight: 700, color: NAVY,
                  letterSpacing: '-0.02em',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.75rem', color: '#8FA8C0',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            onClick={() => navigate('/map')}
            style={{
              padding: '17px 44px',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'white',
              background: btnHovered
                ? `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DARK} 100%)`
                : `linear-gradient(135deg, ${BLUE} 0%, ${NAVY} 100%)`,
              border: 'none',
              borderRadius: 50,
              cursor: 'pointer',
              boxShadow: btnHovered
                ? `0 10px 36px rgba(245,158,11,0.42), 0 2px 10px rgba(0,0,0,0.1)`
                : `0 10px 36px rgba(21,101,192,0.32), 0 2px 10px rgba(0,0,0,0.08)`,
              transform: btnHovered ? 'scale(1.05) translateY(-3px)' : 'scale(1) translateY(0)',
              transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            Access the Map
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </>
  )
}
