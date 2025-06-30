import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Info } from 'lucide-react';

type InsightType = 'recommendation' | 'trend' | 'warning' | 'opportunity' | 'info';

interface InsightCardProps {
  title: string;
  body: string;
  type?: InsightType;
  tags?: string[];
  confidence?: number;
  impact?: 'high' | 'medium' | 'low';
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  error?: Error;
  className?: string;
  testId?: string;
  updatedAt?: Date;
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  body,
  type = 'info',
  tags = [],
  confidence,
  impact,
  actionLabel,
  onAction,
  loading = false,
  error,
  className = '',
  testId,
  updatedAt
}) => {
  // Icon and color mapping based on insight type
  const getTypeDetails = () => {
    switch (type) {
      case 'recommendation':
        return {
          Icon: Lightbulb,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'trend':
        return {
          Icon: TrendingUp,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200'
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'opportunity':
        return {
          Icon: Target,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'info':
      default:
        return {
          Icon: Info,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const { Icon, color, bgColor, borderColor } = getTypeDetails();

  // Impact color mapping
  const getImpactColor = () => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`p-phi-lg bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-start space-x-phi-sm mb-phi-sm">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-phi-sm" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded mt-phi-xs" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-phi-lg bg-white rounded-xl shadow-sm border border-red-200 ${className}`}>
        <div className="text-red-600">
          <AlertTriangle className="w-5 h-5 mb-phi-sm" />
          <p className="text-sm-phi font-medium">Error loading insight</p>
          <p className="text-xs-phi text-red-500 mt-phi-xs">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`p-phi-lg bg-white rounded-xl shadow-sm border ${borderColor} hover:shadow-lg transition-all duration-300 ${className}`}
      data-testid={testId}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ x: 4 }}
    >
      {/* Header with icon and title */}
      <div className="flex items-start space-x-phi-sm mb-phi-sm">
        <div className={`p-phi-sm ${bgColor} rounded-lg flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
      </div>

      {/* Body text - Rule #2: Left-aligned text */}
      <p className="text-sm-phi text-gray-700 leading-relaxed mb-phi text-left">
        {body}
      </p>

      {/* Tags and metadata */}
      {(tags.length > 0 || confidence || impact) && (
        <div className="flex flex-wrap items-center gap-phi-sm mb-phi">
          {/* Tags */}
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-phi-sm py-phi-xs rounded-full text-xs-phi font-medium bg-gray-100 text-gray-700"
            >
              {tag}
            </span>
          ))}
          
          {/* Confidence score */}
          {confidence !== undefined && (
            <span className="inline-flex items-center px-phi-sm py-phi-xs rounded-full text-xs-phi font-medium bg-blue-100 text-blue-700">
              {confidence}% confidence
            </span>
          )}
          
          {/* Impact level */}
          {impact && (
            <span className={`inline-flex items-center px-phi-sm py-phi-xs rounded-full text-xs-phi font-medium ${getImpactColor()}`}>
              {impact} impact
            </span>
          )}
        </div>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`w-full px-phi py-phi-sm ${bgColor} ${color} rounded-lg hover:opacity-80 transition-opacity text-sm-phi font-medium`}
        >
          {actionLabel}
        </button>
      )}

      {/* Last updated timestamp - Rule #17 */}
      {updatedAt && (
        <p className="text-xs-phi text-gray-500 mt-phi">
          Generated {updatedAt.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Manila'
          })} PHT
        </p>
      )}
    </motion.div>
  );
};

export default InsightCard;