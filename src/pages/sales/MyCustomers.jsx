import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, DollarSign, CheckCircle, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { Card, Button, Badge, LoadingSpinner, Input, Select, Table, StatCard } from '../../components/common';
import { salesService } from '../../services/salesService';

const MyCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    paidCustomers: 0,
    pendingCustomers: 0,
    totalCommissions: 0
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log(`🔄 Loading customers... (force refresh: ${forceRefresh})`);
      
      const response = await salesService.getMyCustomers(forceRefresh ? { _t: Date.now() } : {});
      const customerData = response.users || [];
      setCustomers(customerData);

      // Calculate stats from the backend data
      const totalCustomers = customerData.length;
      const paidCustomers = customerData.filter(c => c.hasFirstPayment).length;
      const pendingCustomers = totalCustomers - paidCustomers;
      const totalCommissions = customerData.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

      setStats({
        totalCustomers,
        paidCustomers,
        pendingCustomers,
        totalCommissions
      });

      console.log('✅ Customers loaded:', {
        total: totalCustomers,
        paid: paidCustomers,
        commissions: totalCommissions,
        customerSample: customerData.slice(0, 3).map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          hasCommission: c.hasCommission,
          commissionAmount: c.commissionAmount
        }))
      });

    } catch (error) {
      console.error('❌ Error loading customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPaymentStatus = (customer) => {
    if (customer.hasFirstPayment) {
      return customer.hasCommission ? 'paid' : 'processing';
    }
    return 'pending';
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'processing': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'pending': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'processing': return 'Processing';
      case 'pending': return 'Pending Payment';
      default: return 'Unknown';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' || 
      customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getPaymentStatus(customer);
    const matchesFilter = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      key: 'customer',
      title: 'Customer',
      render: (_, customer) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {customer.firstName} {customer.lastName}
            </div>
            <div className="text-sm text-gray-500">{customer.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (_, customer) => (
        <div className="text-sm text-gray-900">
          {customer.phoneNumber || 'N/A'}
        </div>
      )
    },
    {
      key: 'registrationDate',
      title: 'Registration Date',
      render: (_, customer) => (
        <div>
          <div className="text-sm text-gray-900">
            {new Date(customer.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(customer.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      key: 'paymentStatus',
      title: 'Payment Status',
      render: (_, customer) => {
        const status = getPaymentStatus(customer);
        return (
          <div className="space-y-1">
            <Badge variant={getPaymentStatusColor(status)} className="flex items-center space-x-1">
              {getPaymentStatusIcon(status)}
              <span>{getPaymentStatusText(status)}</span>
            </Badge>
            {customer.firstPaymentDate && (
              <div className="text-xs text-gray-500">
                Paid: {new Date(customer.firstPaymentDate).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'commission',
      title: 'Commission',
      render: (_, customer) => {
        // Force show correct commission amounts
        const commissionAmount = customer.commissionAmount || 0;
        const hasCommission = customer.hasCommission;
        
        return (
          <div className="text-right">
            {hasCommission ? (
              <div>
                <div className="text-sm font-bold text-green-600">
                  ${commissionAmount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">{customer.commissionCurrency || 'USD'}</div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-400">$0.00</div>
                <div className="text-xs text-gray-400">
                  {customer.hasFirstPayment ? 'Processing' : 'Pending'}
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, customer) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCustomer(customer)}
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
        title="My Customers"
        subtitle="Manage your registered customers and track commissions"
        actions={
          <div className="flex space-x-2">
            <Button 
              onClick={() => loadCustomers(true)} 
              disabled={refreshing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Button onClick={() => loadCustomers()}>
              View All
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={Users}
            subtitle="All registrations"
          />
          <StatCard
            title="Paid Customers"
            value={stats.paidCustomers}
            icon={CheckCircle}
            subtitle="Made first payment"
            className="border-green-200"
          />
          <StatCard
            title="Pending Payment"
            value={stats.pendingCustomers}
            icon={Clock}
            subtitle="Awaiting payment"
            className="border-yellow-200"
          />
          <StatCard
            title="Total Commissions"
            value={`${stats.totalCommissions.toFixed(2)}`}
            icon={DollarSign}
            subtitle="From paid customers"
            className="border-blue-200"
          />
        </div>

        <Card className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search customers..."
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
                  { value: 'all', label: 'All Customers' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'pending', label: 'Pending Payment' },
                ]}
                className="w-40"
              />
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Payment Status Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {customers.filter(c => getPaymentStatus(c) === 'paid').length}
              </div>
              <div className="text-xs text-green-700">Paid & Commissioned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">
                {customers.filter(c => getPaymentStatus(c) === 'processing').length}
              </div>
              <div className="text-xs text-yellow-700">Payment Processing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">
                {customers.filter(c => getPaymentStatus(c) === 'pending').length}
              </div>
              <div className="text-xs text-gray-700">Pending Payment</div>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            data={filteredCustomers}
            loading={loading}
            emptyState={
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-500 mb-4">
                  {customers.length === 0 
                    ? 'Start registering customers to see them here.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {customers.length === 0 && (
                  <Button variant="primary" onClick={() => window.location.href = '/sales/register-customer'}>
                    Register First Customer
                  </Button>
                )}
              </div>
            }
          />
        </Card>

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedCustomer(null)}></div>
              
              <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{selectedCustomer.email}</div>
                    <Badge variant={getPaymentStatusColor(getPaymentStatus(selectedCustomer))} className="mt-2">
                      {getPaymentStatusIcon(getPaymentStatus(selectedCustomer))}
                      <span className="ml-1">{getPaymentStatusText(getPaymentStatus(selectedCustomer))}</span>
                    </Badge>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedCustomer.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedCustomer.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration Date:</span>
                        <span className="font-medium">
                          {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Commission Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Payment & Commission</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Has Made Payment:</span>
                        <span className="font-medium">
                          {selectedCustomer.hasFirstPayment ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {selectedCustomer.firstPaymentDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">First Payment Date:</span>
                          <span className="font-medium">
                            {new Date(selectedCustomer.firstPaymentDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission Status:</span>
                        <span className="font-medium">
                          {selectedCustomer.hasCommission ? 'Earned' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission Amount:</span>
                        <span className="font-medium text-green-600">
                          ${(selectedCustomer.commissionAmount || 0).toFixed(2)} {selectedCustomer.commissionCurrency || 'USD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="secondary" onClick={() => setSelectedCustomer(null)}>
                      Close
                    </Button>
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Contact Customer
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

export default MyCustomers; 
