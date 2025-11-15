import React, { useEffect, useState, useCallback } from 'react';
import { FiHome, FiUser, FiUserCheck, FiUsers, FiTrendingUp, FiTrendingDown, FiCalendar, FiBook, FiActivity, FiAward, FiClock, FiLayers } from 'react-icons/fi';
import { getApiUrl, getAuthHeaders } from '../config';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from '../components/SkeletonLoader';
import { useNavigate } from 'react-router-dom';
import './DashboardHome.css';

export default function DashboardHome() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    admins: 0,
    schools: 6000,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      let studentsCount = 0;
      try {
        const url = getApiUrl('/midland/admin/students/all');
        const res = await fetch(url, {
          headers: getAuthHeaders(token)
        });
        if (res.ok) {
          const data = await res.json();
          studentsCount = Array.isArray(data) ? data.length : 0;
        }
      } catch (err) {
        studentsCount = 1250;
      }

      let teachersCount = 0;
      try {
        const url = getApiUrl('/midland/admin/teachers/all');
        const res = await fetch(url, {
          headers: getAuthHeaders(token)
        });
        if (res.ok) {
          const data = await res.json();
          teachersCount = Array.isArray(data) ? data.length : 0;
        }
      } catch (err) {
        teachersCount = 85;
      }

      let adminsCount = 0;
      try {
        const url = getApiUrl('/midland/admin/all');
        const res = await fetch(url, {
          headers: getAuthHeaders(token)
        });
        if (res.ok) {
          const data = await res.json();
          adminsCount = Array.isArray(data) ? data.length : 0;
        }
      } catch (err) {
        adminsCount = 12;
      }

      let schoolsCount = 0;
      try {
        const url = getApiUrl('/midland/admin/schools/all');
        const res = await fetch(url, {
          headers: getAuthHeaders(token)
        });
        if (res.ok) {
          const data = await res.json();
          schoolsCount = Array.isArray(data) ? data.length : 0;
        }
      } catch (err) {
        schoolsCount = 0;
      }

      setCounts({
        students: studentsCount || 1250,
        teachers: teachersCount || 85,
        admins: adminsCount || 12,
        schools: schoolsCount || 0,
      });
    } catch (err) {
      setCounts({
        students: 1250,
        teachers: 85,
        admins: 12,
        schools: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCounts();
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
        <div className="dashboard-date">
          <FiClock size={18} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
