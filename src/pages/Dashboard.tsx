import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import { 
  Loader2, 
  ClipboardList, 
  Factory, 
  PackageSearch,
  ShoppingCart,
  Boxes,
  BadgeCheck,
  AlertCircle,
  Clock,
  Play,
  Pause
} from 'lucide-react';
import toast from 'react-hot-toast';

interface JobCardStats {
  Open: number;
  "Work In Progress": number;
  "On Hold": number;
}

interface DashboardStats {
  'Work Order': number;
  'Job Card': JobCardStats;
  'Stock Entry': number;
  'Material Request': number;
  'Purchase Order': number;
  'Quality Inspection': number;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType;
}) => (
  <div className="cohenix-card p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-cohenix-gradient">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const JobCardStatCard = ({ stats }: { stats: JobCardStats }) => (
  <div className="cohenix-card p-6">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-gray-600">Job Cards</p>
      <div className="p-3 rounded-full bg-cohenix-gradient">
        <ClipboardList className="h-6 w-6 text-white" />
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-1.5 rounded-full bg-cohenix-gradient">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm text-gray-600 ml-2">Open</span>
        </div>
        <span className="text-lg font-semibold text-gray-900">{stats.Open}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-1.5 rounded-full bg-cohenix-gradient">
            <Play className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm text-gray-600 ml-2">In Progress</span>
        </div>
        <span className="text-lg font-semibold text-gray-900">{stats["Work In Progress"]}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-1.5 rounded-full bg-cohenix-gradient">
            <Pause className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm text-gray-600 ml-2">On Hold</span>
        </div>
        <span className="text-lg font-semibold text-gray-900">{stats["On Hold"]}</span>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.message);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cohenix-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="content-card">
          <div className="flex items-center justify-center text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Open Work Orders',
      value: stats?.['Work Order'] || 0,
      icon: Factory
    },
    {
      title: 'Recent Stock Entries',
      value: stats?.['Stock Entry'] || 0,
      icon: Boxes
    },
    {
      title: 'Material Requests',
      value: stats?.['Material Request'] || 0,
      icon: ShoppingCart
    },
    {
      title: 'Purchase Orders',
      value: stats?.['Purchase Order'] || 0,
      icon: PackageSearch
    },
    {
      title: 'Quality Inspections',
      value: stats?.['Quality Inspection'] || 0,
      icon: BadgeCheck
    }
  ];

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Overview</h1>
        <p className="text-gray-600">Monitor your warehouse operations in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats?.['Job Card'] && (
          <JobCardStatCard stats={stats['Job Card']} />
        )}
        
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>
    </div>
  );
}