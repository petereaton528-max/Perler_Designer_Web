import type { BeadStatistics } from '../core'

interface BeadStatisticsPanelProps {
  readonly statistics: BeadStatistics
}

export function BeadStatisticsPanel({ statistics }: BeadStatisticsPanelProps) {
  return (
    <section className="statistics-card" aria-labelledby="statistics-title">
      <div className="statistics-summary">
        <div>
          <p className="section-label">MATERIALS</p>
          <h2 id="statistics-title">颜色统计</h2>
        </div>
        <div className="total-beads">
          <strong>{statistics.totalBeads.toLocaleString()}</strong>
          <span>总豆数</span>
        </div>
      </div>

      <div className="statistics-list" role="list" aria-label="拼豆颜色用量">
        {statistics.entries.map((entry) => (
          <div className="statistics-row" role="listitem" key={entry.colorCode}>
            <span
              className="color-swatch"
              style={{ backgroundColor: `rgb(${entry.red}, ${entry.green}, ${entry.blue})` }}
              aria-label={`${entry.colorName} 色块`}
            />
            <div className="color-identity">
              <strong>{entry.colorCode}</strong>
              <span>{entry.colorName}</span>
              <small className="mobile-brand">{entry.brandName}</small>
            </div>
            <span className="color-brand">{entry.brandName}</span>
            <span className="color-count"><strong>{entry.count.toLocaleString()}</strong> 颗</span>
          </div>
        ))}
      </div>
    </section>
  )
}
