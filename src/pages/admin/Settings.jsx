import React from 'react';
import { Layout, Header } from '../../components/layout';
import { Card } from '../../components/common';

const Settings = () => {
  return (
    <Layout>
      <Header 
        title="System Settings"
        subtitle="Configure commission rates and system preferences"
      />
      <div className="p-6">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Coming Soon</h3>
          <p className="text-gray-500">System configuration options will be available here.</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;