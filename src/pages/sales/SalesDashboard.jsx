// src/pages/sales/SalesDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, Target, Plus, TrendingUp, Award, RefreshCw } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { StatCard, Card, Button, Badge, LoadingSpinner } from '../../components/common';
import { salesService } from '../../services/salesService';
import { useAuth } from '../../context/AuthContext';

const SalesDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Add cache-busting timestamp to force fresh data
      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      
      const response = await salesService.getDashboard(cacheBuster);
      setDashboard(response.dashboard);
      
      console.log('📊 Dashboard data loaded:', {
        totalEarnings: response.dashboard?.stats?.totalEarnings,
        recentCommissions: response.dashboard?.recentCommissions?.length,
        timestamp: new Date().toISOString(),
        forceRefresh
      });
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Set mock data for development
      setDashboard({
        stats: {
          totalCustomers: 25,
          totalEarnings: 2500,
          pendingCommissions: 450,
          thisMonthRegistrations: 8
        },
        currentWeek: {
          target: 20,
          registrations: 8,
          paidRegistrations: 6,
          weekStart: '2024-06-03'
        },
        salesPerson: user?.user || {
          firstName: 'Sales',
          lastName: 'Person',
          salesId: 'SP0001'
        },
        recentCommissions: [
          { id: 1, customerName: 'John Doe', amount: 100, date: '2024-06-05', status: 'pending' },
          { id: 2, customerName: 'Jane Smith', amount: 100, date: '2024-06-04', status: 'paid' },
          { id: 3, customerName: 'Mike Johnson', amount: 100, date: '2024-06-03', status: 'paid' }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const currentWeek = dashboard?.currentWeek || {};
  const stats = dashboard?.stats || {};
  const salesPerson = dashboard?.salesPerson || user?.user || {};
  const recentCommissions = dashboard?.recentCommissions || [];

  const targetProgress = currentWeek.target 
    ? Math.round((currentWeek.paidRegistrations / currentWeek.target) * 100) 
    : 0;

  const isTargetMet = targetProgress >= 100;

  return (
    <Layout>
      <Header 
        title={`Welcome back, ${salesPerson.firstName}! 👋`}
        subtitle="Ready to achieve your weekly target? You've got this!"
        actions={
          <div className="flex space-x-2">
            <Button 
              onClick={() => loadDashboard(true)}
              variant="outline"
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </Button>
            <Link to="/sales/register">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Register Customer
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Weekly Target Progress */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-700">Weekly Target</p>
                  <p className="text-2xl font-bold text-green-900">
                    {currentWeek.paidRegistrations || 0}/{currentWeek.target || 20}
                  </p>
                </div>
              </div>
              {isTargetMet && (
                <Badge variant="success">
                  <Award className="w-3 h-3 mr-1" />
                  Target Met!
                </Badge>
              )}
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(targetProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-green-600">
              {targetProgress}% complete • {Math.max(0, (currentWeek.target || 20) - (currentWeek.paidRegistrations || 0))} more to go
            </p>
          </Card>

          {/* Total Customers */}
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers || 0}
            icon={Users}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />

          {/* Total Earnings */}
          <StatCard
            title="Total Earnings"
            value={`$${stats.totalEarnings || 0}`}
            icon={DollarSign}
            color="yellow"
            trend={{ value: 8, isPositive: true }}
          />

          {/* Pending Commissions */}
          <StatCard
            title="Pending Commissions"
            value={`$${stats.pendingCommissions || 0}`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Commissions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Commissions</h3>
              <Link to="/sales/earnings">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentCommissions.length > 0 ? (
                recentCommissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{commission.customerName}</p>
                      <p className="text-sm text-gray-500">{commission.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${commission.amount}</p>
                      <Badge variant={commission.status === 'paid' ? 'success' : 'warning'}>
                        {commission.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No commissions yet</p>
                  <p className="text-sm text-gray-400">Start registering customers to earn commissions</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/sales/register">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-3" />
                  Register New Customer
                </Button>
              </Link>
              <Link to="/sales/customers">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-3" />
                  View My Customers
                </Button>
              </Link>
              <Link to="/sales/earnings">
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="w-4 h-4 mr-3" />
                  View Earnings
                </Button>
              </Link>
            </div>

            {/* Performance Tip */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Performance Tip</h4>
              <p className="text-sm text-blue-700">
                {targetProgress < 50 
                  ? "Focus on quality leads and follow up with prospects to boost your weekly numbers!"
                  : targetProgress < 100
                  ? "You're doing great! Just a few more registrations to hit your target."
                  : "Excellent work! You've exceeded your target. Keep up the momentum!"
                }
              </p>
            </div>
          </Card>
        </div>

        {/* Sales Person Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Person Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Sales ID</p>
              <p className="font-medium text-gray-900">{salesPerson.salesId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Commission Rate</p>
              <p className="font-medium text-gray-900">25%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weekly Target</p>
              <p className="font-medium text-gray-900">{currentWeek.target || 20} customers</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default SalesDashboard;
