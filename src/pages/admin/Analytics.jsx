// src/pages/admin/Analytics.jsx 
import React from 'react';
import { Layout, Header } from '../../components/layout';
import { Card } from '../../components/common';

const Analytics = () => {
  return (
    <Layout>
      <Header 
        title="Sales Analytics"
        subtitle="Performance insights and reports"
      />
      <div className="p-6">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
          <p className="text-gray-500">Advanced analytics and reporting features will be available here.</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;