// src/pages/sales/MyEarnings.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Download, Filter, Eye, RefreshCw } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { Card, Button, Badge, LoadingSpinner, Select, Table, StatCard } from '../../components/common';
import { salesService } from '../../services/salesService';

const MyEarnings = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    thisWeek: 0,
    pending: 0,
    confirmed: 0,
    paidOut: 0,
  });

  useEffect(() => {
    loadEarnings();
  }, [filterPeriod, filterStatus]);

  const loadEarnings = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = { t: forceRefresh ? Date.now() : undefined };
      if (filterPeriod !== 'all') params.period = filterPeriod;
      if (filterStatus !== 'all') params.status = filterStatus;

      console.log('📊 Loading earnings with params:', params);
      
      const response = await salesService.getMyCommissions(params);
      const commissionData = response.commissions || [];
      setCommissions(commissionData);

      console.log('💰 Commission data received:', {
        count: commissionData.length,
        totalAmount: commissionData.reduce((sum, c) => sum + c.commissionAmount, 0),
        latestCommissions: commissionData.slice(0, 3).map(c => ({
          customer: `${c.userId?.firstName} ${c.userId?.lastName}`,
          amount: c.commissionAmount
        }))
      });

      // Calculate stats
      const total = commissionData.reduce((sum, c) => sum + c.commissionAmount, 0);
      const now = new Date();
      const thisMonth = commissionData
        .filter(c => new Date(c.createdAt).getMonth() === now.getMonth())
        .reduce((sum, c) => sum + c.commissionAmount, 0);
      
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeek = commissionData
        .filter(c => new Date(c.createdAt) >= oneWeekAgo)
        .reduce((sum, c) => sum + c.commissionAmount, 0);

      const pending = commissionData.filter(c => c.status === 'pending').length;
      const confirmed = commissionData.filter(c => c.status === 'confirmed').length;
      const paidOut = commissionData.filter(c => c.status === 'paid_out').length;

      setStats({
        totalEarnings: total,
        thisMonth,
        thisWeek,
        pending,
        confirmed,
        paidOut,
      });

      console.log('📈 Stats calculated:', {
        totalEarnings: total,
        thisMonth,
        thisWeek,
        statusCounts: { pending, confirmed, paidOut }
      });

    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'paid_out': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'paid_out': return '💰';
      default: return '?';
    }
  };

  const columns = [
    {
      key: 'date',
      title: 'Date',
      render: (_, commission) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(commission.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(commission.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (_, commission) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {commission.userId?.firstName} {commission.userId?.lastName}
          </div>
          <div className="text-xs text-gray-500">{commission.userId?.email}</div>
        </div>
      )
    },
    {
      key: 'payment',
      title: 'Payment Details',
      render: (_, commission) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            ${commission.paymentAmount?.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            Rate: {(commission.commissionRate * 100)}%
          </div>
        </div>
      )
    },
    {
      key: 'commission',
      title: 'Commission',
      render: (_, commission) => (
        <div className="text-right">
          <div className="text-sm font-bold text-green-600">
            ${commission.commissionAmount.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">{commission.currency}</div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, commission) => (
        <Badge variant={getStatusColor(commission.status)}>
          {getStatusIcon(commission.status)} {commission.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, commission) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCommission(commission)}
          className="p-2"
        >
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ];

  return (
    <Layout>
      <Header 
        title="My Earnings"
        subtitle="Track your commission history and earnings"
        actions={
          <div className="flex space-x-2">
            <Button 
              onClick={() => loadEarnings(true)}
              disabled={refreshing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Earnings"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            icon={DollarSign}
            subtitle="All time"
          />
          <StatCard
            title="This Month"
            value={`$${stats.thisMonth.toFixed(2)}`}
            icon={Calendar}
            change={stats.thisMonth > 0 ? "+15.3%" : "0%"}
            changeType="positive"
          />
          <StatCard
            title="This Week"
            value={`$${stats.thisWeek.toFixed(2)}`}
            icon={TrendingUp}
            change={stats.thisWeek > 0 ? "+8.2%" : "0%"}
            changeType="positive"
          />
          <StatCard
            title="Avg per Commission"
            value={`$${commissions.length > 0 ? (stats.totalEarnings / commissions.length).toFixed(2) : '0.00'}`}
            icon={DollarSign}
            subtitle={`${commissions.length} commissions`}
          />
        </div>

        {/* Status Overview */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Status Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-sm text-green-700">Confirmed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.paidOut}</div>
              <div className="text-sm text-blue-700">Paid Out</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Commission History</h2>
            <div className="flex items-center space-x-3">
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                ]}
                className="w-32"
              />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'paid_out', label: 'Paid Out' },
                ]}
                className="w-32"
              />
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            data={commissions}
            loading={loading}
            emptyState={
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions yet</h3>
                <p className="text-gray-500 mb-4">Start registering customers to earn your first commission!</p>
              </div>
            }
          />
        </Card>

        {/* Commission Details Modal */}
        {selectedCommission && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedCommission(null)}></div>
              
              <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Commission Details</h3>
                  <button
                    onClick={() => setSelectedCommission(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Commission Amount */}
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      ${selectedCommission.commissionAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-700 mt-1">Commission Earned</div>
                    <Badge variant={getStatusColor(selectedCommission.status)} className="mt-2">
                      {getStatusIcon(selectedCommission.status)} {selectedCommission.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Customer</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">
                        {selectedCommission.userId?.firstName} {selectedCommission.userId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{selectedCommission.userId?.email}</div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Amount:</span>
                        <span className="font-medium">${selectedCommission.paymentAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="font-medium">{(selectedCommission.commissionRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">{selectedCommission.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date Earned:</span>
                        <span className="font-medium">
                          {new Date(selectedCommission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Status Timeline</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Commission earned</span>
                        <span className="text-xs text-gray-400">
                          {new Date(selectedCommission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedCommission.status === 'confirmed' && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Commission confirmed</span>
                        </div>
                      )}
                      {selectedCommission.status === 'paid_out' && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Commission paid out</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="secondary" onClick={() => setSelectedCommission(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyEarnings;
