export default function DashboardLoading() {
  return (
    <div className="dashboard-skeleton" aria-label="Cargando dashboard" aria-busy="true">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton skeleton-side" />
      </div>
      <div className="skeleton-metrics">
        {Array.from({ length: 5 }).map((_, index) => <div className="skeleton skeleton-metric" key={index} />)}
      </div>
    </div>
  );
}
