import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  path: string;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isReportsRoot = location.pathname === '/reports';

  const reports: ReportCard[] = [
    {
      title: 'Spending by Category',
      description: 'Analyze your expenses by category over time.',
      icon: '📊',
      path: '/reports/spending'
    },
    {
      title: 'Cash Flow',
      description: 'Compare income vs. expenses on a timeline.',
      icon: '📈',
      path: '/reports/cash-flow'
    }
  ];

  if (isReportsRoot) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Card 
              key={report.title} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(report.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{report.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{report.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {report.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default Reports;