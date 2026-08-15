import React from 'react';

const ChurnRiskBadge = ({ level }) => {
  const getBadgeStyle = () => {
    switch (level?.toLowerCase()) {
      case 'high':
      case 'high risk':
        return { backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5' };
      case 'medium':
        return { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' };
      case 'low':
        return { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' };
    }
  };

  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block',
        textAlign: 'center',
        ...getBadgeStyle(),
      }}
    >
      {level}
    </span>
  );
};

export default ChurnRiskBadge;