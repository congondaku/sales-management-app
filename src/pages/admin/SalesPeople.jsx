import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, CheckCircle, X, Search, Filter } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { Card, Button, Badge, LoadingSpinner, Modal, Input, Select, Table } from '../../components/common';
import { adminService } from '../../services/adminService';

const CreateSalesPersonModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    territory: '',
    commissionRate: 0.25,
    weeklyTarget: 20,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const territories = [
    { value: '', label: 'Select Territory' },
    { value: 'Kinshasa', label: 'Kinshasa' },
    { value: 'Lubumbashi', label: 'Lubumbashi' },
    { value: 'Goma', label: 'Goma' },
    { value: 'Bukavu', label: 'Bukavu' },
    { value: 'Mbuji-Mayi', label: 'Mbuji-Mayi' },
    { value: 'Kananga', label: 'Kananga' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await adminService.createSalesPerson(formData);
      onSuccess();
      onClose();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        territory: '',
        commissionRate: 0.25,
        weeklyTarget: 20,
      });
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Sales Person" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Phone Number"
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="+243..."
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Select
          label="Territory"
          name="territory"
          value={formData.territory}
          onChange={handleChange}
          options={territories}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Commission Rate (%)"
            type="number"
            name="commissionRate"
            value={formData.commissionRate * 100}
            onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: e.target.value / 100 }))}
            min="0"
            max="100"
            step="0.1"
            required
          />
          <Input
            label="Weekly Target"
            type="number"
            name="weeklyTarget"
            value={formData.weeklyTarget}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Sales Person
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const SalesPeople = () => {
  const [salesPeople, setSalesPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    loadSalesPeople();
  }, []);

  const loadSalesPeople = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSalesPeople();
      setSalesPeople(response.salesPeople || []);
    } catch (error) {
      console.error('Error loading sales people:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await adminService.updateSalesPersonStatus(id, !currentStatus);
      await loadSalesPeople(); // Refresh list
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredSalesPeople = salesPeople.filter(person => {
    const matchesSearch = searchTerm === '' || 
      person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.salesId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && person.isActive) ||
      (filterStatus === 'inactive' && !person.isActive);

    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      key: 'salesPerson',
      title: 'Sales Person',
      render: (_, person) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 font-medium">
              {person.firstName.charAt(0)}{person.lastName.charAt(0)}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {person.firstName} {person.lastName}
            </div>
            <div className="text-sm text-gray-500">{person.email}</div>
            <div className="text-xs text-gray-400">{person.salesId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'territory',
      title: 'Territory',
      render: (territory) => territory || 'Not assigned'
    },
    {
      key: 'performance',
      title: 'Performance',
      render: (_, person) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            ${(person.totalEarnings || 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            {person.totalRegistrations || 0} customers
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, person) => (
        <Badge variant={person.isActive ? 'success' : 'danger'}>
          {person.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, person) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPerson(person)}
            className="p-2"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus(person._id, person.isActive)}
            className={`p-2 ${person.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
          >
            {person.isActive ? <Trash2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <Header 
        title="Sales Team Management"
        subtitle="Create and manage your sales team members"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Sales Person
          </Button>
        }
      />

      <div className="p-6">
        <Card className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by name, email, or ID..."
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
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' },
                ]}
                className="w-40"
              />
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{salesPeople.length}</div>
              <div className="text-sm text-blue-700">Total Sales People</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {salesPeople.filter(p => p.isActive).length}
              </div>
              <div className="text-sm text-green-700">Active</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ${salesPeople.reduce((sum, p) => sum + (p.totalEarnings || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-orange-700">Total Earnings</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {salesPeople.reduce((sum, p) => sum + (p.totalRegistrations || 0), 0)}
              </div>
              <div className="text-sm text-purple-700">Total Customers</div>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            data={filteredSalesPeople}
            loading={loading}
            emptyState={
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sales people yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first sales person.</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Sales Person
                </Button>
              </div>
            }
          />
        </Card>

        {/* Create Sales Person Modal */}
        <CreateSalesPersonModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadSalesPeople}
        />

        {/* View Details Modal */}
        {selectedPerson && (
          <Modal
            isOpen={!!selectedPerson}
            onClose={() => setSelectedPerson(null)}
            title="Sales Person Details"
            maxWidth="max-w-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xl">
                    {selectedPerson.firstName.charAt(0)}{selectedPerson.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedPerson.firstName} {selectedPerson.lastName}
                  </h3>
                  <p className="text-gray-500">{selectedPerson.salesId}</p>
                  <Badge variant={selectedPerson.isActive ? 'success' : 'danger'}>
                    {selectedPerson.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Email:</span> {selectedPerson.email}</div>
                    <div><span className="text-gray-600">Phone:</span> {selectedPerson.phoneNumber}</div>
                    <div><span className="text-gray-600">Territory:</span> {selectedPerson.territory || 'Not assigned'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Total Earnings:</span> ${(selectedPerson.totalEarnings || 0).toFixed(2)}</div>
                    <div><span className="text-gray-600">Customers:</span> {selectedPerson.totalRegistrations || 0}</div>
                    <div><span className="text-gray-600">Commission Rate:</span> {((selectedPerson.commissionRate || 0.25) * 100)}%</div>
                    <div><span className="text-gray-600">Weekly Target:</span> {selectedPerson.weeklyTarget || 20}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setSelectedPerson(null)}>
                  Close
                </Button>
                <Button>
                  Edit Details
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default SalesPeople;