import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Phone, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { Card, Button, Input, Badge } from '../../components/common';
import { salesService } from '../../services/salesService';

const RegisterCustomer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (simple check for DRC format)
    const phoneRegex = /^(\+243|243|0)?[0-9]{9}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid DRC phone number';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Format phone number
      let phoneNumber = formData.phoneNumber.replace(/\s/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+243' + phoneNumber.slice(1);
      } else if (phoneNumber.startsWith('243')) {
        phoneNumber = '+' + phoneNumber;
      } else if (!phoneNumber.startsWith('+243')) {
        phoneNumber = '+243' + phoneNumber;
      }

      const customerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber,
        password: formData.password,
      };

      await salesService.registerCustomer(customerData);
      setSuccess(true);

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/sales/customers');
      }, 2000);

    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Registered!</h2>
            <p className="text-gray-600 mb-6">
              You've successfully registered a new customer. You'll earn a 25% commission when they make their first payment.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/sales/customers')} className="w-full">
                View My Customers
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSuccess(false)} 
                className="w-full"
              >
                Register Another Customer
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header 
        title="Register New Customer"
        subtitle="Add a new customer to your portfolio and earn commission"
      />

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Info Banner */}
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Commission Information</h3>
                <p className="text-blue-700 text-sm mt-1">
                  You earn <strong>25% commission</strong> when this customer makes their first payment. 
                  Make sure to provide accurate information and help them complete their registration.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Registration</h2>
              <p className="text-gray-600 mt-2">Fill in the customer's details below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  placeholder="Enter first name"
                />
                <Input
                  label="Last Name *"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  placeholder="Enter last name"
                />
              </div>

              {/* Contact Fields */}
              <Input
                label="Email Address *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                placeholder="customer@example.com"
              />

              <Input
                label="Phone Number *"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                icon={<Phone className="w-5 h-5 text-gray-400" />}
                placeholder="+243 XXX XXX XXX"
              />

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password *"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  placeholder="Create password"
                />
                <Input
                  label="Confirm Password *"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  icon={<Lock className="w-5 h-5 text-gray-400" />}
                  placeholder="Confirm password"
                />
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-900">Registration Failed</h3>
                      <p className="text-red-700 text-sm mt-1">{errors.submit}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => navigate('/sales')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  loading={loading}
                  className="min-w-[200px]"
                >
                  {loading ? 'Registering...' : 'Register Customer'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Help Section */}
          <Card className="p-6 mt-6 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">Registration Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                <span>Double-check all information before submitting</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                <span>Ensure the customer uses a valid email they can access</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                <span>Phone number should be reachable for verification</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                <span>Help the customer complete their first listing for your commission</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterCustomer;