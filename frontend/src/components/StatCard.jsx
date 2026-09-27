import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  accentColor = '#38bdf8', 
  bgGlow = 'rgba(56, 189, 248, 0.1)',
  onClick 
}) {
  return (
    <div 
      className="glass-panel stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderTop: `2px solid ${accentColor}`
      }}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div 
          className="stat-card-icon"
          style={{
            backgroundColor: bgGlow,
            color: accentColor,
            border: `1px solid ${accentColor}33`
          }}
        >
          {Icon && <Icon size={18} />}
        </div>
      </div>

      <div 
        className="stat-card-value"
        style={{ color: accentColor }}
      >
        {value}
      </div>

      {subtext && (
        <span className="stat-card-subtext">{subtext}</span>
      )}
    </div>
  );
}
