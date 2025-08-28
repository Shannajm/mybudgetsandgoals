import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GettingStartedBannerProps {
  hasAnyData: boolean;
}

const GettingStartedBanner: React.FC<GettingStartedBannerProps> = ({ hasAnyData }) => {
  const navigate = useNavigate();

  if (hasAnyData) {
    return null;
  }

  return (
    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl mb-2">🚀</div>
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
            Getting Started
          </h3>
          <p className="text-blue-700 dark:text-blue-200">
            Add your first account to begin tracking your finances
          </p>
          <Button 
            onClick={() => navigate('/accounts')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Your First Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GettingStartedBanner;