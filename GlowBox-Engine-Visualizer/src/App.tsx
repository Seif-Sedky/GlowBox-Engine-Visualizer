import { useUIStore } from '@store/ui.store'
import { Starfield } from '@ui/canvas/Starfield'
import { Landing } from '@ui/shell/Landing'
import { Visualizer } from '@ui/shell/Visualizer'

export function App() {
  const { screen, theme } = useUIStore()

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%' }}
      data-theme={theme}
    >
      {/* Global SVG filter defs for glow effects */}
      <svg className="glow-filter-defs" aria-hidden>
        <defs>
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-md">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-lg">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>

      {/* Always-on starfield behind everything */}
      <Starfield theme={theme} />

      {/* Screen router */}
      {screen === 'landing'    && <Landing />}
      {screen === 'visualizer' && <Visualizer />}
    </div>
  )
}
