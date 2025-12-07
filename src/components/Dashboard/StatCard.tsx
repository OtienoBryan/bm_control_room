import React from 'react';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    positive: boolean;
  };
  prefix?: string;
  suffix?: string;
  position: number;
}
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  prefix = '',
  suffix = '',
  position
}) => {
  const bgColor = position % 2 === 1 ? 'bg-red-900' : 'bg-blue-950';
  
  return <div className={`${bgColor} overflow-hidden shadow rounded-lg opacity-80`}>
      <div className="p-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-red-50 rounded-md p-2">{icon}</div>
          <div className="ml-3 w-0 flex-1">
            <dl>
              <dt className="text-xs font-medium text-white truncate">
                {title}
              </dt>
              <dd>
                <div className="text-sm font-medium text-white">
                  {prefix}
                  {value}
                  {suffix}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
       
    </div>;
};
export default StatCard;