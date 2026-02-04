export const QuickStats = () => {
  const { realtimeStats } = useSelector((state) => state.ndaku);

  if (!realtimeStats) return null;

  return (
    <div className="quick-stats">
      <div className="stat">
        <span className="label">Active Now</span>
        <span className="value">{realtimeStats.activeUsers}</span>
      </div>
      <div className="stat">
        <span className="label">24h Searches</span>
        <span className="value">{realtimeStats.searchesLast24h}</span>
      </div>
      <div className="stat">
        <span className="label">Last Hour</span>
        <span className="value">{realtimeStats.searchesLastHour}</span>
      </div>
    </div>
  );
};