import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'green', 
  trend, 
  trendValue,
  delay = 0 
}) {
  const colorClasses = {
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  };

  const colorClass = colorClasses[color] || colorClasses.green;

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5 }}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass.gradient} opacity-5 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-300`} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.border} border`}>
          <Icon className={`w-6 h-6 ${colorClass.text}`} />
        </div>
        
        {trend && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
            trend === 'up' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {trend === 'up' ? (
              <FiTrendingUp className="w-3 h-3" />
            ) : (
              <FiTrendingDown className="w-3 h-3" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        
        <div className="flex items-baseline space-x-2">
          <motion.span 
            className="text-3xl font-bold text-gray-800"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
          >
            {value}
          </motion.span>
        </div>
        
        {subtitle && (
          <p className="text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClass.gradient}`} />
    </motion.div>
  );
} 