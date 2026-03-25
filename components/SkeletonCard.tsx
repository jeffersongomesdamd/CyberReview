'use client'

export default function SkeletonCard() {
  return (
    <div style={{
      background: '#111118',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Image skeleton */}
      <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%' }} />
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Category */}
        <div className="skeleton" style={{ height: 20, width: '30%', borderRadius: 100 }} />
        {/* Title */}
        <div className="skeleton" style={{ height: 18, width: '85%' }} />
        <div className="skeleton" style={{ height: 18, width: '60%' }} />
        {/* Author */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        </div>
        {/* Attributes */}
        {[0.9, 0.7, 0.8, 0.6].map((w, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <div className="skeleton" style={{ height: 10, width: `${w * 50}%` }} />
              <div className="skeleton" style={{ height: 10, width: '15%' }} />
            </div>
            <div className="skeleton" style={{ height: 6, width: '100%' }} />
          </div>
        ))}
        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
          <div className="skeleton" style={{ height: 30, width: 60, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 30, width: 60, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 30, width: 40, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 30, width: 60, borderRadius: 6, marginLeft: 'auto' }} />
        </div>
      </div>
    </div>
  )
}
