import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, Eye, Check, Download, Calendar, AlertCircle } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { Card, Button, Badge, LoadingSpinner, Input, Select, Table, StatCard } from '../../components/common';
import { adminService } from '../../services/adminService';

const Commissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [processingPayout, setProcessingPayout] = useState(null);
  const [stats, setStats] = useState({
    totalCommissions: 0,
    pendingAmount: 0,
    confirmedAmount: 0,
    paidAmount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    paidCount: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCommissions();
    loadStats();
  }, [filterStatus, filterPeriod]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPeriod !== 'all') params.period = filterPeriod;

      console.log('🔄 Loading commissions with params:', params);
      
      const response = await adminService.getCommissions(params);
      const commissionData = response.commissions || [];
      
      console.log('📊 Received commission data:', commissionData.length, 'commissions');
      
      setCommissions(commissionData);

    } catch (error) {
      console.error('❌ Error loading commissions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getCommissionStats();
      setStats(response.stats);
      console.log('📊 Commission stats loaded:', response.stats);
    } catch (error) {
      console.error('❌ Error loading commission stats:', error);
    }
  };

  const markAsPaid = async (commissionId, notes = '') => {
    try {
      setProcessingPayout(commissionId);
      await adminService.markCommissionAsPaid(commissionId, notes);
      await loadCommissions(); // Refresh list
      await loadStats(); // Refresh stats
      console.log('✅ Commission marked as paid successfully');
    } catch (error) {
      console.error('❌ Error marking commission as paid:', error);
      setError(error.message);
    } finally {
      setProcessingPayout(null);
    }
  };

  const processBatchPayout = async () => {
    try {
      const confirmedCommissionIds = commissions
        .filter(c => c.status === 'confirmed')
        .map(c => c._id);
      
      if (confirmedCommissionIds.length === 0) {
        alert('No confirmed commissions to pay out');
        return;
      }
      
      const confirmed = window.confirm(
        `Are you sure you want to mark ${confirmedCommissionIds.length} commission(s) as paid?`
      );
      
      if (!confirmed) return;
      
      await adminService.batchPayoutCommissions(confirmedCommissionIds, 'Batch payout');
      await loadCommissions();
      await loadStats();
      console.log('✅ Batch payout completed successfully');
    } catch (error) {
      console.error('❌ Error processing batch payout:', error);
      setError(error.message);
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

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = searchTerm === '' || 
      commission.salesPersonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

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
      key: 'salesPerson',
      title: 'Sales Person',
      render: (_, commission) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {commission.salesPersonName || 'Unknown'}
          </div>
          <div className="text-xs text-gray-500">
            ID: {commission.salesPersonSalesId || commission.salesPersonId}
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
            Plan: {commission.planId}
          </div>
          <div className="text-xs text-gray-500">
            Customer paid: ${commission.paymentAmount?.toFixed(2)} {commission.paymentCurrency}
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
          <div className="text-xs text-gray-500">
            Plan value: ${commission.planUSDValue}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, commission) => (
        <div className="space-y-1">
          <Badge variant={getStatusColor(commission.status)}>
            {getStatusIcon(commission.status)} {commission.status.replace('_', ' ')}
          </Badge>
          {commission.paidOutAt && (
            <div className="text-xs text-gray-500">
              Paid: {new Date(commission.paidOutAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, commission) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCommission(commission)}
            className="p-2"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {commission.status === 'confirmed' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => markAsPaid(commission._id)}
              loading={processingPayout === commission._id}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Pay
            </Button>
          )}
        </div>
      )
    }
  ];

  if (loading && commissions.length === 0) {
    return (
      <Layout>
        <Header title="Commission Management" />
        <div className="p-6 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header 
        title="Commission Management"
        subtitle="Track and manage commission payments"
        actions={
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={loadCommissions} loading={loading}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto"
              >
                ✕
              </Button>
            </div>
          </Card>
        )}

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Debug Info</h4>
            <div className="text-sm text-blue-700">
              <div>Total commissions loaded: {commissions.length}</div>
              <div>API stats: {JSON.stringify(stats)}</div>
              <div>Current filters: Status={filterStatus}, Period={filterPeriod}</div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Commissions"
            value={`$${stats.totalCommissions.toFixed(2)}`}
            icon={DollarSign}
            subtitle={`${stats.totalCount || commissions.length} total`}
          />
          <StatCard
            title="Pending Review"
            value={`$${stats.pendingAmount.toFixed(2)}`}
            icon={Calendar}
            subtitle={`${stats.pendingCount} commissions`}
            className="border-yellow-200"
          />
          <StatCard
            title="Ready to Pay"
            value={`$${stats.confirmedAmount.toFixed(2)}`}
            icon={Check}
            subtitle={`${stats.confirmedCount} commissions`}
            className="border-green-200"
          />
          <StatCard
            title="Paid Out"
            value={`$${stats.paidAmount.toFixed(2)}`}
            icon={DollarSign}
            subtitle={`${stats.paidCount} commissions`}
            className="border-blue-200"
          />
        </div>

        {/* Quick Actions */}
        {stats.confirmedCount > 0 && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">Ready for Payout</h3>
                <p className="text-green-700 text-sm">
                  {stats.confirmedCount} commission(s) totaling ${stats.confirmedAmount.toFixed(2)} are ready to be paid out.
                </p>
              </div>
              <Button variant="primary" onClick={processBatchPayout}>
                Process Batch Payout
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by sales person or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5 text-gray-400" />}
              />
            </div>
            <div className="flex items-center space-x-3">
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
            </div>
          </div>

          {/* Commission Status Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.pendingCount}</div>
              <div className="text-xs text-yellow-700">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.confirmedCount}</div>
              <div className="text-xs text-green-700">Ready to Pay</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.paidCount}</div>
              <div className="text-xs text-blue-700">Paid Out</div>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            data={filteredCommissions}
            loading={loading}
            emptyState={
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
                <p className="text-gray-500 mb-4">
                  {commissions.length === 0 
                    ? 'Commissions will appear here as sales people earn them.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {commissions.length === 0 && (
                  <Button variant="outline" onClick={loadCommissions}>
                    Refresh Data
                  </Button>
                )}
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
                    <div className="text-sm text-green-700 mt-1">Commission Amount</div>
                    <Badge variant={getStatusColor(selectedCommission.status)} className="mt-2">
                      {getStatusIcon(selectedCommission.status)} {selectedCommission.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Sales Person */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sales Person</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">
                        {selectedCommission.salesPersonName || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{selectedCommission.salesPersonEmail}</div>
                      <div className="text-sm text-gray-500">ID: {selectedCommission.salesPersonSalesId}</div>
                    </div>
                  </div>

                  {/* Customer */}
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
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium">{selectedCommission.planId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan USD Value:</span>
                        <span className="font-medium">${selectedCommission.planUSDValue?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Paid:</span>
                        <span className="font-medium">
                          ${selectedCommission.paymentAmount?.toFixed(2)} {selectedCommission.paymentCurrency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="font-medium">{(selectedCommission.commissionRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission Currency:</span>
                        <span className="font-medium">{selectedCommission.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date Earned:</span>
                        <span className="font-medium">
                          {new Date(selectedCommission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedCommission.paidOutAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paid Out Date:</span>
                          <span className="font-medium">
                            {new Date(selectedCommission.paidOutAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedCommission.payoutNotes && (
                        <div className="mt-3">
                          <span className="text-gray-600">Notes:</span>
                          <div className="mt-1 text-sm bg-gray-100 p-2 rounded">
                            {selectedCommission.payoutNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="secondary" onClick={() => setSelectedCommission(null)}>
                      Close
                    </Button>
                    {selectedCommission.status === 'confirmed' && (
                      <Button
                        onClick={() => {
                          markAsPaid(selectedCommission._id);
                          setSelectedCommission(null);
                        }}
                        loading={processingPayout === selectedCommission._id}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark as Paid
                      </Button>
                    )}
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

export default Commissions;