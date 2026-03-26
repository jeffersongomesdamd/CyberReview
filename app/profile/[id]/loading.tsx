import Navbar from '@/components/Navbar'
import SkeletonCard from '@/components/SkeletonCard'

export default function ProfileLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Profile header skeleton */}
        <div style={{
          background: '#111118',
          borderRadius: 16,
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
        }}>
          <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton" style={{ height: 28, width: '40%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 16, width: '30%', borderRadius: 4 }} />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }} />
        </div>

        {/* Reviews outline skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}
