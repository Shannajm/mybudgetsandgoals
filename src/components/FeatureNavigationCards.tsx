import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  path: string;
}

const FeatureNavigationCards: React.FC = () => {
  const navigate = useNavigate();

  const features: FeatureCard[] = [
    {
      title: 'Accounts',
      description: 'View & manage your accounts',
      icon: '🏦',
      path: '/accounts'
    },
    {
      title: 'Transactions',
      description: 'Track spending & income',
      icon: '💳',
      path: '/transactions'
    },
    {
      title: 'Bills',
      description: 'See upcoming bills & pay with one click',
      icon: '📄',
      path: '/bills'
    },
    {
      title: 'Goals',
      description: 'Set & monitor savings goals',
      icon: '🎯',
      path: '/goals'
    },
    {
      title: 'Loans',
      description: 'Manage loans & payments',
      icon: '🏠',
      path: '/loans'
    },
    {
      title: 'Reports',
      description: 'Analyze spending with charts',
      icon: '📊',
      path: '/reports'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...features, { title: 'Fixed Savings', description: 'Forced savings & fixed deposits', icon: '💰', path: '/fixed-savings' }].map((feature) => (
        <Card 
          key={feature.title} 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(feature.path)}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{feature.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeatureNavigationCards;
