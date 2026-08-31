import { useEffect, useState } from "react";
import "./Ndaku.css";
import { Last24 } from "../Last24/Last24";
import { Last10 } from "../Last10/Last10";
import { Activities } from "../Activites/Activities";

const ndakuApi = 'https://nd-ca63c97939154afda89f1e74f48e5d0d.ecs.us-east-1.on.aws'

const NdakuStandalone = () => {
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [marketInsights, setMarketInsights] = useState(null);
  const [migrationPatterns, setMigrationPatterns] = useState(null);
  const [loading, setLoading] = useState({ realtime: true, market: false, migration: false });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState("all");
  const [timeframe, setTimeframe] = useState(30);
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  const fetchRealtimeStats = async () => {
    try {
      setLoading(prev => ({ ...prev, realtime: true }));
      const response = await fetch(`${ndakuApi}/api/analytics-data/realtime-stats`);
      const data = await response.json();
      setRealtimeStats(data.data);
      setLastUpdated(new Date().toISOString());
      setLoading(prev => ({ ...prev, realtime: false }));
    } catch (err) {
      setError(err.message);
      setLoading(prev => ({ ...prev, realtime: false }));
    }
  };

  const fetchMarketInsights = async (tf = 30) => {
    try {
      setLoading(prev => ({ ...prev, market: true }));
      const response = await fetch(`${ndakuApi}/api/analytics-data/market-insights?timeframe=${tf}`);
      const data = await response.json();
      setMarketInsights(data.data);
      setLoading(prev => ({ ...prev, market: false }));
    } catch (err) {
      setError(err.message);
      setLoading(prev => ({ ...prev, market: false }));
    }
  };

  const fetchMigrationPatterns = async (tf = 30) => {
    try {
      setLoading(prev => ({ ...prev, migration: true }));
      const response = await fetch(`${ndakuApi}/api/analytics-data/migration-patterns?timeframe=${tf}`);
      const data = await response.json();
      setMigrationPatterns(data.data);
      setLoading(prev => ({ ...prev, migration: false }));
    } catch (err) {
      setError(err.message);
      setLoading(prev => ({ ...prev, migration: false }));
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchRealtimeStats();
    fetchMarketInsights(timeframe);
    fetchMigrationPatterns(timeframe);

    // Minimum loading time
    const minLoadTimer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 1000);

    // Poll realtime stats every 30 seconds
    const realtimeInterval = setInterval(() => {
      fetchRealtimeStats();
    }, 30000);

    // Update market insights every 15 minutes
    const marketInterval = setInterval(() => {
      fetchMarketInsights(timeframe);
      fetchMigrationPatterns(timeframe);
    }, 900000);

    return () => {
      clearTimeout(minLoadTimer);
      clearInterval(realtimeInterval);
      clearInterval(marketInterval);
    };
  }, [timeframe]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    fetchMarketInsights(newTimeframe);
    fetchMigrationPatterns(newTimeframe);
  };

  const colorPalette = [
    "bg-indigo-500",
    "bg-fuchsia-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-pink-500",
    "bg-purple-500",
  ];

  // ===== DATA TRANSFORMATIONS =====
  
  const topCountriesData =
    realtimeStats?.worldwide?.topCountries?.map((country, index) => ({
      label: country._id,
      value: country.count,
      color: colorPalette[index % colorPalette.length],
    })) || [];

  const topLocationsData =
    realtimeStats?.drc?.topLocations?.map((location, index) => ({
      label: location._id,
      value: location.count,
      color: colorPalette[index % colorPalette.length],
    })) || [];

  const topCountriesByActivity =
    marketInsights?.worldwide?.topCountries?.map((location, index) => ({
      label: location._id,
      value: location.searches,
      color: colorPalette[index % colorPalette.length],
    })) || [];

  // Device preferences data
  const devicePreferencesData =
    marketInsights?.digitalBehavior?.devicePreferences
      ?.slice(0, 10)
      .map((device, index) => ({
        label: `${device._id.device} - ${device._id.browser}`,
        value: device.sessionCount,
        color: colorPalette[index % colorPalette.length],
      })) || [];

  // Budget distribution data
  const budgetDistributionData =
    marketInsights?.drc?.economicIntelligence?.budgetDistribution
      ?.slice(0, 8)
      .map((budget, index) => ({
        label: `${budget._id.priceRange} (${budget._id.province})`,
        value: budget.searches,
        color: colorPalette[index % colorPalette.length],
      })) || [];

  // Property type preferences
  const propertyTypeData =
    marketInsights?.drc?.propertyMarketTrends?.typePreferences
      ?.slice(0, 10)
      .map((type, index) => ({
        label: `${type._id.propertyType} (${type._id.province})`,
        value: type.searches,
        color: colorPalette[index % colorPalette.length],
      })) || [];

  const buildBarData = (entries, key) => {
    if (!Array.isArray(entries) || entries.length === 0) return [];
    const counts = entries.reduce((acc, e) => {
      const k = e?.[key] || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    return sorted.map(([label, value], idx) => ({
      label,
      value,
      color: colorPalette[idx % colorPalette.length],
    }));
  };

  const last10ByTypeData = buildBarData(realtimeStats?.liveActivity, "type");
  const last10ByCountryData = buildBarData(
    realtimeStats?.liveActivity,
    "country"
  );

  // Show loading if either: still loading data OR minimum time hasn't passed
  if ((loading.realtime && !realtimeStats) || minLoadingTime) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ndaku-error">
        <h3>⚠️ Erreur de chargement des analyses</h3>
        <p>{error}</p>
        <button onClick={() => fetchRealtimeStats()}>
          🔄 Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="ndaku-dashboard">
      <div className="dashboard-header">
        <h1>🏠 Tableau de bord Ndaku Analytics</h1>
        {lastUpdated && (
          <p className="last-updated">
            Dernière mise à jour :{" "}
            {new Date(lastUpdated).toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button
          className={viewMode === "all" ? "active" : ""}
          onClick={() => setViewMode("all")}
        >
          🌍 Toutes les données
        </button>
        <button
          className={viewMode === "worldwide" ? "active" : ""}
          onClick={() => setViewMode("worldwide")}
        >
          🌎 Mondial
        </button>
        <button
          className={viewMode === "drc" ? "active" : ""}
          onClick={() => setViewMode("drc")}
        >
          🇨🇩 Focus RDC
        </button>
      </div>

      {/* =============== REALTIME STATS =============== */}
      {realtimeStats && (
        <section className="realtime-stats">
          <h2>⚡ Statistiques en temps réel</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Utilisateurs actifs</h3>
              <p className="big-number">{realtimeStats.activeUsers}</p>
              <span>Dernière heure</span>
            </div>

            <div className="stat-card">
              <h3>Recherches (24h)</h3>
              <p className="big-number">{realtimeStats.searchesLast24h}</p>
            </div>

            <div className="stat-card">
              <h3>Recherches (1h)</h3>
              <p className="big-number">{realtimeStats.searchesLastHour}</p>
            </div>
          </div>

          {/* WORLDWIDE: Top Countries - Using Last24 */}
          {(viewMode === "all" || viewMode === "worldwide") &&
            realtimeStats.worldwide?.topCountries && (
              <Last24 data={topCountriesData} title="🌍 Top Pays (24h)" />
            )}

          {/* DRC: Top Locations - Using Last24 */}
          {(viewMode === "all" || viewMode === "drc") &&
            realtimeStats.drc?.topLocations && (
              <Last24
                data={topLocationsData}
                title="🇨🇩 Top des emplacements RDC recherchés (24h)"
              />
            )}

          {/* Live Activity Feed + New Graphs */}
          <div className="live-activity">
            <h3 className="liveH3">
              🔴 Activité en direct (10 dernières minutes)
            </h3>

            {/* New graphs rendered only if there is data */}
            {realtimeStats.liveActivity &&
              realtimeStats.liveActivity.length > 0 && (
                <>
                  <Last10
                    data={last10ByTypeData}
                    title="🔴 Activité en direct par type (10m)"
                  />
                  <Last10
                    title="🔴 Activité en direct par pays (10m)"
                    data={last10ByCountryData}
                  />
                </>
              )}

            {realtimeStats.liveActivity &&
            realtimeStats.liveActivity.length > 0 ? (
              <ul>
                {realtimeStats.liveActivity.map((activity, index) => (
                  <li key={index}>
                    <span className="activity-type">{activity.type}</span>
                    <span className="activity-country">{activity.country}</span>
                    <span className="activity-location">
                      {activity.location}
                    </span>
                    <span className="activity-device">{activity.device}</span>
                    <span className="activity-browser">{activity.browser}</span>
                    {activity.phoneModel && (
                      <span className="activity-phone">
                        {activity.phoneModel}
                      </span>
                    )}
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleTimeString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">Aucune activité récente</p>
            )}
          </div>
        </section>
      )}

      {/* =============== MARKET INSIGHTS =============== */}
      {marketInsights && (
        <section className="market-insights">
          <h2>📊 Rapport d'intelligence de marché</h2>

          {/* ===== TIMEFRAME SELECTOR (Moved here) ===== */}
          <div className="timeframe-selector">
            <h3>📅 Période d'analyse</h3>
            <div className="timeframe-buttons">
              <button
                className={timeframe === 7 ? "active" : ""}
                onClick={() => handleTimeframeChange(7)}
              >
                7 jours
              </button>
              <button
                className={timeframe === 14 ? "active" : ""}
                onClick={() => handleTimeframeChange(14)}
              >
                14 jours
              </button>
              <button
                className={timeframe === 30 ? "active" : ""}
                onClick={() => handleTimeframeChange(30)}
              >
                30 jours
              </button>
              <button
                className={timeframe === 90 ? "active" : ""}
                onClick={() => handleTimeframeChange(90)}
              >
                3 mois
              </button>
              <button
                className={timeframe === 180 ? "active" : ""}
                onClick={() => handleTimeframeChange(180)}
              >
                6 mois
              </button>
              <button
                className={timeframe === 365 ? "active" : ""}
                onClick={() => handleTimeframeChange(365)}
              >
                1 an
              </button>
              <button
                className={timeframe === 0 ? "active" : ""}
                onClick={() => handleTimeframeChange(0)}
              >
                Tout
              </button>
            </div>
          </div>

          <div className="report-info">
            <p>📅 Période : {marketInsights.reportInfo?.period}</p>
            <p>
              📍 Points de données totaux :{" "}
              {marketInsights.reportInfo?.dataPoints?.toLocaleString("fr-FR")}
            </p>
            <p>
              👥 Utilisateurs uniques :{" "}
              {marketInsights.reportInfo?.uniqueUsers?.toLocaleString("fr-FR")}
            </p>
            <p>✅ Fiabilité : {marketInsights.meta?.confidenceLevel}</p>
          </div>

          {/* WORLDWIDE INSIGHTS */}
          {(viewMode === "all" || viewMode === "worldwide") &&
            marketInsights.worldwide && (
              <div className="worldwide-section">
                <h3>🌎 Analyses mondiales</h3>

                <div className="worldwide-summary">
                  <p>
                    Total des pays :{" "}
                    {marketInsights.worldwide.summary?.totalCountries || 0}
                  </p>
                  <p>
                    Pays principal :{" "}
                    {marketInsights.worldwide.summary?.topCountry || "N/A"}
                  </p>
                  <p>
                    Total des recherches mondiales :{" "}
                    {marketInsights.worldwide.summary?.totalSearches?.toLocaleString(
                      "fr-FR"
                    ) || 0}
                  </p>
                </div>

                {topCountriesByActivity.length > 0 && (
                  <Activities
                    data={topCountriesByActivity}
                    title="🌍 Top des pays par activité"
                  />
                )}
              </div>
            )}

          {/* DRC-SPECIFIC INSIGHTS */}
          {(viewMode === "all" || viewMode === "drc") && marketInsights.drc && (
            <div className="drc-section">
              <h3>🇨🇩 Analyse approfondie RDC</h3>

              {/* Location Intelligence */}
              {marketInsights.drc.locationIntelligence && (
                <div className="location-intelligence">
                  <h4>📍 Zones à forte demande en RDC</h4>
                  <div className="drc-summary">
                    <p>
                      Total des emplacements :{" "}
                      {marketInsights.drc.locationIntelligence.summary
                        ?.totalLocationsSearched || 0}
                    </p>
                    <p>
                      Demande la plus élevée :{" "}
                      {marketInsights.drc.locationIntelligence.summary
                        ?.highestDemandLocation || "N/A"}
                    </p>
                    <p>
                      Moy. recherches/emplacement :{" "}
                      {marketInsights.drc.locationIntelligence.summary
                        ?.averageSearchesPerLocation || 0}
                    </p>
                  </div>

                  {marketInsights.drc.locationIntelligence.topDemandAreas && (
                    <ul>
                      {marketInsights.drc.locationIntelligence.topDemandAreas
                        .slice(0, 15)
                        .map((area, index) => (
                          <li key={index}>
                            <span className="area-name">
                              {area._id.location}
                            </span>
                            <span className="area-searches">
                              {area.searches} recherches
                            </span>
                            <span className="area-users">
                              {area.uniqueUsersCount} utilisateurs
                            </span>
                            <span className="area-score">
                              Score : {area.demandScore}
                            </span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Budget Distribution */}
              {budgetDistributionData.length > 0 && (
                <Activities
                  data={budgetDistributionData}
                  title="💰 Distribution du budget RDC"
                />
              )}

              {/* Property Type Preferences */}
              {propertyTypeData.length > 0 && (
                <Activities
                  data={propertyTypeData}
                  title="🏘️ Types de propriétés recherchés en RDC"
                />
              )}
            </div>
          )}

          {/* Device Preferences (Global) */}
          {marketInsights.digitalBehavior && devicePreferencesData.length > 0 && (
            <div className="device-preferences">
              <Activities
                data={devicePreferencesData}
                title="💻 Utilisation des appareils et navigateurs"
              />

              <h4 className="liveH3">
                📊 Détails des appareils et navigateurs
              </h4>
              {marketInsights.digitalBehavior.devicePreferences && (
                <ul>
                  {marketInsights.digitalBehavior.devicePreferences
                    .slice(0, 15)
                    .map((device, index) => (
                      <li key={index}>
                        <span className="device">{device._id.device}</span>
                        <span className="browser">{device._id.browser}</span>
                        <span className="sessions">
                          {device.sessionCount} sessions
                        </span>
                        <span className="events">
                          {device.totalEvents} événements
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          {/* Recommendations */}
          {marketInsights.meta?.recommendedActions &&
            marketInsights.meta.recommendedActions.length > 0 && (
              <div className="recommendations">
                <h3>💡 Actions recommandées</h3>
                <ul>
                  {marketInsights.meta.recommendedActions.map(
                    (action, index) => (
                      <li key={index}>{action}</li>
                    )
                  )}
                </ul>
              </div>
            )}
        </section>
      )}
    </div>
  );
};

export default NdakuStandalone;
