import Navbar from '@/components/Navbar'

export default function ReviewLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 120, height: 28, borderRadius: 100 }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
          </div>
        </div>

        {/* Title */}
        <div className="skeleton" style={{ width: '70%', height: 48, borderRadius: 8 }} />
        
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 150, height: 12, borderRadius: 4 }} />
          </div>
        </div>

        {/* Image */}
        <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 16 }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="skeleton" style={{ width: '100%', height: 16, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: '100%', height: 16, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: '80%', height: 16, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
}
