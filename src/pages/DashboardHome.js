import React, { useEffect, useState, useCallback } from 'react';
import { FiHome, FiUser, FiUserCheck, FiUsers, FiTrendingUp, FiTrendingDown, FiCalendar, FiBook, FiActivity, FiAward, FiClock, FiLayers, FiRefreshCw } from 'react-icons/fi';
import { getApiUrl, getAuthHeaders } from '../config';
import { useAuth } from '../context/AuthContext';
import { fetchAllPaginatedItems } from '../utils/api';
import { SkeletonCard } from '../components/SkeletonLoader';
import { GrowthChart, AttendanceChart, DistributionChart, PerformanceChart } from '../components/Charts';
import { useNavigate } from 'react-router-dom';
import './DashboardHome.css';

export default function DashboardHome() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    admins: 0,
    schools: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState({
    growth: null,
    attendance: null,
    distribution: null,
    performance: null
  });
  const hasFetchedRef = React.useRef(false);

  const fetchCounts = useCallback(async (forceRefresh = false) => {
    // Don't refetch if we already fetched once (unless forced)
    if (hasFetchedRef.current && !forceRefresh) {
      return;
    }

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      hasFetchedRef.current = true;
    }
    setLoading(true);
    try {
      // Fetch all counts with pagination support
      let studentsCount = 0;
      let teachersCount = 0;
      let adminsCount = 0;
      let schoolsCount = 0;

      try {
        const [allStudents, allTeachers, allAdmins, allSchools] = await Promise.all([
          fetchAllPaginatedItems('/midland/admin/students/all', token, getApiUrl, getAuthHeaders),
          fetchAllPaginatedItems('/midland/admin/teachers/all', token, getApiUrl, getAuthHeaders),
          fetchAllPaginatedItems('/midland/admin/all', token, getApiUrl, getAuthHeaders),
          fetchAllPaginatedItems('/midland/admin/schools/all', token, getApiUrl, getAuthHeaders)
        ]);
        
        studentsCount = allStudents.length;
        teachersCount = allTeachers.length;
        adminsCount = allAdmins.length;
        schoolsCount = allSchools.length;
      } catch (err) {
        // If parallel fetch fails, try sequential
        try {
          studentsCount = (await fetchAllPaginatedItems('/midland/admin/students/all', token, getApiUrl, getAuthHeaders)).length;
        } catch (e) { studentsCount = 0; }
        
        try {
          teachersCount = (await fetchAllPaginatedItems('/midland/admin/teachers/all', token, getApiUrl, getAuthHeaders)).length;
        } catch (e) { teachersCount = 0; }
        
        try {
          adminsCount = (await fetchAllPaginatedItems('/midland/admin/all', token, getApiUrl, getAuthHeaders)).length;
        } catch (e) { adminsCount = 0; }
        
        try {
          schoolsCount = (await fetchAllPaginatedItems('/midland/admin/schools/all', token, getApiUrl, getAuthHeaders)).length;
        } catch (e) { schoolsCount = 0; }
      }

      setCounts({
        students: studentsCount,
        teachers: teachersCount,
        admins: adminsCount,
        schools: schoolsCount,
      });

      // Generate chart data based on counts
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const growthData = {
        labels: months,
        students: months.map((_, i) => Math.floor(studentsCount * (0.7 + (i * 0.05)))),
        teachers: months.map((_, i) => Math.floor(teachersCount * (0.7 + (i * 0.05))))
      };

      const attendanceData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        attendance: [94, 96, 93, 95, 97, 92]
      };

      const distributionData = {
        labels: ['Active', 'Inactive', 'Pending'],
        values: [
          Math.floor((studentsCount / (studentsCount + 10)) * 100),
          Math.floor((5 / (studentsCount + 10)) * 100),
          Math.floor((5 / (studentsCount + 10)) * 100)
        ]
      };

      const performanceData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        performance: [85, 88, 87, 90]
      };

      setChartData({
        growth: growthData,
        attendance: attendanceData,
        distribution: distributionData,
        performance: performanceData
      });
    } catch (err) {
      setCounts({
        students: 0,
        teachers: 0,
        admins: 0,
        schools: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    // Reset fetch flag when token changes
    hasFetchedRef.current = false;
    fetchCounts();
  }, [fetchCounts, token]);

  // Refresh data when page becomes visible (user navigates back from another tab/window)
  useEffect(() => {
    let timeoutId = null;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear any pending refresh
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Page became visible, refresh data after a short delay to avoid too frequent refreshes
        timeoutId = setTimeout(() => {
          hasFetchedRef.current = false;
          fetchCounts(true);
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchCounts]);

  const mainCards = [
    { 
      label: 'Total Schools', 
      count: counts.schools, 
      icon: FiHome, 
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      link: '/schools',
      trend: { value: '+12%', direction: 'up', caption: 'vs last month' },
      subtitle: 'Active institutions'
    },
    { 
      label: 'Students', 
      count: counts.students, 
      icon: FiUsers, 
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      link: '/students',
      trend: { value: '+8%', direction: 'up', caption: 'vs last month' },
      subtitle: 'Enrolled students'
    },
    { 
      label: 'Teachers', 
      count: counts.teachers, 
      icon: FiUserCheck, 
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      link: '/teachers',
      trend: { value: '+5%', direction: 'up', caption: 'vs last month' },
      subtitle: 'Active faculty'
    },
    { 
      label: 'Administrators', 
      count: counts.admins, 
      icon: FiUser, 
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      link: '/admin',
      trend: { value: '+2%', direction: 'up', caption: 'vs last month' },
      subtitle: 'Admin staff'
    },
  ];

  const stats = [
    { 
      label: 'Overall Attendance', 
      value: '94.5%', 
      icon: FiTrendingUp, 
      trend: '+2.3%', 
      caption: 'vs last term',
      color: '#10b981',
      change: 'positive'
    },
    { 
      label: 'Active Classes', 
      value: '156', 
      icon: FiBook, 
      trend: '+5', 
      caption: 'new this month',
      color: '#3b82f6',
      change: 'positive'
    },
    { 
      label: 'Upcoming Events', 
      value: '8', 
      icon: FiCalendar, 
      trend: 'This month', 
      caption: 'Scheduled',
      color: '#f59e0b',
      change: 'neutral'
    },
    { 
      label: 'Performance Rate', 
      value: '87%', 
      icon: FiAward, 
      trend: '-1.2%', 
      caption: 'needs attention',
      color: '#8b5cf6',
      change: 'negative'
    },
  ];

  const quickActions = [
    { icon: FiUsers, label: 'Add Student', action: () => navigate('/students/create'), color: '#ef4444', description: 'Create a new student profile' },
    { icon: FiUserCheck, label: 'Add Teacher', action: () => navigate('/teachers/create'), color: '#3b82f6', description: 'Onboard teaching staff' },
    { icon: FiUser, label: 'Add Admin', action: () => navigate('/admin/create'), color: '#10b981', description: 'Grant administrative access' },
    { icon: FiLayers, label: 'Add School', action: () => navigate('/schools/create'), color: '#ef4444', description: 'Register a new school' },
    { icon: FiBook, label: 'View Subjects', action: () => navigate('/subjects'), color: '#f59e0b', description: 'Manage curriculum' },
    { icon: FiCalendar, label: 'Timetable', action: () => navigate('/timetable'), color: '#8b5cf6', description: 'Review daily schedule' },
  ];

  const recentActivity = [
    { type: 'student', message: 'New student enrolled', time: '2 hours ago', icon: FiUsers },
    { type: 'teacher', message: 'Teacher profile updated', time: '5 hours ago', icon: FiUserCheck },
    { type: 'event', message: 'Parent meeting scheduled', time: '1 day ago', icon: FiCalendar },
    { type: 'admin', message: 'System backup completed', time: '2 days ago', icon: FiActivity },
  ];

  return (
    <div className="page dashboard-modern">
      <div className="dashboard-header-modern">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              hasFetchedRef.current = false;
              fetchCounts(true);
            }}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Refresh data"
          >
            <FiRefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        <div className="dashboard-date">
          <FiClock size={18} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-grid-modern">
          {[1, 2, 3, 4].map(idx => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : (
        <>
          <div className="dashboard-grid-modern">
            {mainCards.map((card, idx) => {
            const Icon = card.icon;
            const TrendIcon = card.trend.direction === 'down' ? FiTrendingDown : FiTrendingUp;
            const trendClass = `card-trend ${card.trend.direction}`;
            return (
                <div 
                  key={idx} 
                  className="dashboard-card-modern"
                  onClick={() => card.link && navigate(card.link)}
                  style={{ '--card-color': card.color }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      card.link && navigate(card.link);
                    }
                  }}
                >
                  <div className="card-background" style={{ background: card.bgGradient }}></div>
                  <div className="card-content">
                    <div className="card-header">
                      <div className="card-icon-wrapper" style={{ background: `${card.color}20` }}>
                        <Icon size={20} style={{ color: card.color }} />
                      </div>
                      <div className={trendClass}>
                        <TrendIcon size={12} />
                        <strong>{card.trend.value}</strong>
                        <span className="trend-caption">{card.trend.caption}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-count">{card.count.toLocaleString()}</div>
                      <div className="card-label">{card.label}</div>
                      <div className="card-subtitle">{card.subtitle}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dashboard-stats-modern">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="stat-card-modern">
                  <div className="stat-icon-modern" style={{ background: `${stat.color}15`, color: stat.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="stat-content-modern">
                    <div className="stat-value-modern" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="stat-label-modern">{stat.label}</div>
                    <div className={`stat-trend-modern ${stat.change}`}>
                      {stat.change === 'positive' && <FiTrendingUp size={12} />}
                      {stat.change === 'negative' && <FiTrendingDown size={12} />}
                      <span>{stat.trend}</span>
                      <small>{stat.caption}</small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="dashboard-charts-section">
            <div className="chart-card">
              <GrowthChart data={chartData.growth} title="Student & Teacher Growth" />
            </div>
            <div className="chart-card">
              <AttendanceChart data={chartData.attendance} title="Weekly Attendance Trends" />
            </div>
            <div className="chart-card">
              <DistributionChart data={chartData.distribution} title="Status Distribution" />
            </div>
            <div className="chart-card">
              <PerformanceChart data={chartData.performance} title="Performance Analytics" />
            </div>
          </div>

          <div className="dashboard-bottom-section">
            <div className="quick-actions-modern">
              <h3 className="section-title">Quick Actions</h3>
              <div className="quick-actions-grid-modern">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button 
                      key={idx} 
                      type="button"
                      className="quick-action-modern"
                      onClick={action.action}
                      style={{ '--action-color': action.color }}
                      aria-label={action.description}
                    >
                      <div className="action-icon-wrapper" style={{ background: `${action.color}15` }}>
                        <Icon size={22} style={{ color: action.color }} />
                      </div>
                      <div className="quick-action-content">
                        <span className="quick-action-label">{action.label}</span>
                        <span className="quick-action-description">{action.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="recent-activity-modern">
              <h3 className="section-title">Recent Activity</h3>
              <div className="activity-list">
                {recentActivity.map((activity, idx) => {
                  const Icon = activity.icon;
                  return (
                    <div key={idx} className="activity-item">
                      <div className="activity-icon">
                        <Icon size={18} />
                      </div>
                      <div className="activity-content">
                        <div className="activity-message">{activity.message}</div>
                        <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            );
          })}
        </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
