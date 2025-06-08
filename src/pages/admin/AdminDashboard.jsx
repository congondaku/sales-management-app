// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, Target, TrendingUp, Plus, Eye, ChevronRight } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { StatCard, Card, Button, Badge, LoadingSpinner } from '../../components/common';
import { adminService } from '../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSalesPeople: 0,
    totalCommissions: 0,
    avgTargetAchievement: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load multiple data sources in parallel
      const [analyticsResponse, salesPeopleResponse, commissionsResponse] = await Promise.all([
        adminService.getSalesAnalytics({ period: 'month' }),
        adminService.getSalesPeople({ active: true }),
        adminService.getCommissions({ limit: 10 })
      ]);

      // Process analytics data
      const analytics = analyticsResponse.analytics || [];
      const totalCommissions = analytics.reduce((sum, item) => sum + (item.totalCommissions || 0), 0);
      const avgAchievement = analytics.length > 0 
        ? analytics.reduce((sum, item) => sum + (item.achievementPercentage || 0), 0) / analytics.length 
        : 0;

      setStats({
        totalRevenue: totalCommissions * 4, // Assuming commission is 25%
        activeSalesPeople: salesPeopleResponse.salesPeople?.length || 0,
        totalCommissions,
        avgTargetAchievement: Math.round(avgAchievement),
      });

      // Set top performers
      const performers = analytics
        .sort((a, b) => (b.totalCommissions || 0) - (a.totalCommissions || 0))
        .slice(0, 5);
      setTopPerformers(performers);

      // Set recent activity (commissions)
      setRecentActivity(commissionsResponse.commissions || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header 
        title="Sales Management Dashboard"
        subtitle="Monitor and manage your sales team performance"
        actions={
          <Link to="/admin/sales-people">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Sales Person
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            change="+12.5%"
            changeType="positive"
            subtitle="This month"
          />
          <StatCard
            title="Active Sales People"
            value={stats.activeSalesPeople}
            icon={Users}
            change="+8.2%"
            changeType="positive"
          />
          <StatCard
            title="Commissions Paid"
            value={`$${stats.totalCommissions.toLocaleString()}`}
            icon={DollarSign}
            change="+15.3%"
            changeType="positive"
            subtitle="This month"
          />
          <StatCard
            title="Avg Target Achievement"
            value={`${stats.avgTargetAchievement}%`}
            icon={Target}
            change="-3.1%"
            changeType="negative"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Commissions</h2>
                <Link to="/admin/commissions">
                  <Button variant="outline" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((commission) => (
                    <div key={commission._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {commission.salesPersonName || 'Unknown Sales Person'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Earned ${commission.commissionAmount?.toFixed(2)} commission
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={commission.status === 'confirmed' ? 'success' : 'warning'}>
                          {commission.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                    <p className="text-gray-500">Commission activity will appear here</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Top Performers */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Top Performers</h2>
                <Link to="/admin/analytics">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {topPerformers.length > 0 ? (
                  topPerformers.map((performer, index) => (
                    <div key={performer._id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {performer.salesPersonName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${performer.totalCommissions?.toFixed(2)} earned
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No performance data yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/sales-people"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 group-hover:text-green-900">Add Sales Person</h3>
                <p className="text-sm text-gray-500">Create a new sales account</p>
              </div>
            </Link>

            <Link
              to="/admin/commissions"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 group-hover:text-green-900">Process Payouts</h3>
                <p className="text-sm text-gray-500">Review pending commissions</p>
              </div>
            </Link>

            <Link
              to="/admin/analytics"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 group-hover:text-green-900">View Analytics</h3>
                <p className="text-sm text-gray-500">Performance insights</p>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <div className="text-center">
                <Target className="w-8 h-8 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 group-hover:text-green-900">Settings</h3>
                <p className="text-sm text-gray-500">Commission & targets</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;