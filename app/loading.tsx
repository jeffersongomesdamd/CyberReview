import SkeletonCard from '@/components/SkeletonCard'
import Navbar from '@/components/Navbar'

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <Navbar />
      {/* Stats bar skeleton */}
      <div style={{
        background: 'rgba(0,242,255,0.02)',
        borderBottom: '1px solid rgba(0,242,255,0.07)',
        height: 48,
        display: 'flex', alignItems: 'center', padding: '0 1.5rem',
      }}>
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', gap: '2rem' }}>
          <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 120, height: 16, borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Título Skeleton */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="skeleton" style={{ width: 300, height: 40, marginBottom: '0.5rem', borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 250, height: 16, borderRadius: 4 }} />
        </div>

        {/* Filtros Skeleton */}
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 6 }} />
        </div>

        {/* Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}
