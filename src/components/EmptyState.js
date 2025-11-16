import React from 'react';
import { FiInbox, FiUsers, FiBook, FiCalendar } from 'react-icons/fi';
import './EmptyState.css';

const iconMap = {
  students: FiUsers,
  teachers: FiUsers,
  admins: FiUsers,
  schools: FiUsers,
  subjects: FiBook,
  timetable: FiCalendar,
  default: FiInbox,
};

export default function EmptyState({ 
  type = 'default', 
  title, 
  message, 
  actionLabel, 
  onAction,
  icon: CustomIcon 
}) {
  const Icon = CustomIcon || iconMap[type] || iconMap.default;
  
  const defaultMessages = {
    students: {
      title: 'No Students Found',
      message: 'Get started by adding your first student to the system.',
    },
    teachers: {
      title: 'No Teachers Found',
      message: 'Add teachers to manage classes and subjects.',
    },
    admins: {
      title: 'No Administrators Found',
      message: 'Add administrators to manage the school system.',
    },
    schools: {
      title: 'No Schools Found',
      message: 'Get started by adding your first school to the system.',
    },
    subjects: {
      title: 'No Subjects Found',
      message: 'Create subjects to organize your curriculum.',
    },
    timetable: {
      title: 'No Timetable Entries',
      message: 'Create timetable entries to schedule classes.',
    },
    default: {
      title: title || 'No Data Available',
      message: message || 'There is no data to display at this time.',
    },
  };

  const content = defaultMessages[type] || defaultMessages.default;

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={64} />
      </div>
      <h3 className="empty-state-title">{content.title}</h3>
      <p className="empty-state-message">{content.message}</p>
      {onAction && (
        <button className="empty-state-action btn-secondary" onClick={onAction}>
          {actionLabel || 'Add New'}
        </button>
      )}
    </div>
  );
}

