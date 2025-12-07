import React from 'react';
import { recentActivity } from '../../utils/demoData';
import { FileTextIcon, AlertCircleIcon, CheckCircleIcon, CreditCardIcon, EditIcon } from 'lucide-react';
const activityIcons = {
  new_policy: <FileTextIcon className="h-4 w-4 text-green-500" />,
  claim_filed: <AlertCircleIcon className="h-4 w-4 text-yellow-500" />,
  payment: <CreditCardIcon className="h-4 w-4 text-blue-500" />,
  policy_update: <EditIcon className="h-4 w-4 text-purple-500" />,
  claim_approved: <CheckCircleIcon className="h-4 w-4 text-green-500" />
};
const RecentActivity: React.FC = () => {
  return <div className="flow-root">
      <ul className="-mb-6">
        {recentActivity.map((activity, index) => <li key={activity.id}>
            <div className="relative pb-6">
              {index !== recentActivity.length - 1 ? <span className="absolute top-3 left-3 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span> : null}
              <div className="relative flex space-x-2">
                <div>
                  <span className="h-6 w-6 rounded-full flex items-center justify-center ring-6 ring-white bg-white">
                    {activityIcons[activity.type as keyof typeof activityIcons]}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5 flex justify-between space-x-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      {activity.details}{' '}
                      <span className="font-medium text-gray-900">
                        {activity.client}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Policy: {activity.policyNumber}
                    </p>
                  </div>
                  <div className="text-right text-[11px] whitespace-nowrap text-gray-500">
                    {new Date(activity.date).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </li>)}
      </ul>
    </div>;
};
export default RecentActivity;