'use client'

import * as React from 'react'
import { Film, Tv, MapPin, ExternalLink, Trash2, CheckCircle, Calendar, RefreshCcw } from 'lucide-react'
import { updateActivityStatusAction, deleteActivityAction } from '@/actions/activities'
import type { Activity, ActivityStatus } from '@/types/activities'

////////////////////////////////////////////////////////////////////////////////
// COMPONENT
////////////////////////////////////////////////////////////////////////////////

interface ActivityCardProps {
  activity: Activity & { profiles: { display_name: string | null, avatar_url: string | null } | null }
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleStatusChange = async (newStatus: ActivityStatus) => {
    setIsUpdating(true)
    await updateActivityStatusAction(activity.id, newStatus)
    setIsUpdating(false)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this?')) {
      setIsUpdating(true)
      await deleteActivityAction(activity.id)
    }
  }

  const getIcon = () => {
    switch (activity.category) {
      case 'movie': return <Film className="h-4 w-4" />
      case 'show': return <Tv className="h-4 w-4" />
      case 'activity': return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <div className={`p-4 rounded-lg border bg-white dark:bg-gray-950 shadow-sm transition-opacity ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300">
            {getIcon()}
          </span>
          <h3 className="font-semibold text-sm line-clamp-1">{activity.title}</h3>
        </div>
        <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {activity.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
          {activity.description}
        </p>
      )}

      {activity.url && (
        <a href={activity.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:underline mt-2">
          <ExternalLink className="h-3 w-3 mr-1" /> View Link
        </a>
      )}

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <div className="text-[10px] text-gray-400">
          Suggested by {activity.profiles?.display_name || 'Partner'}
        </div>
        
        <div className="flex space-x-1">
          {activity.status === 'suggested' && (
            <>
              <ActionButton icon={<Calendar className="h-3 w-3" />} label="Plan" onClick={() => handleStatusChange('planned')} />
              <ActionButton icon={<CheckCircle className="h-3 w-3" />} label="Done" onClick={() => handleStatusChange('completed')} />
            </>
          )}
          {activity.status === 'planned' && (
            <>
              <ActionButton icon={<RefreshCcw className="h-3 w-3" />} label="Revert" onClick={() => handleStatusChange('suggested')} />
              <ActionButton icon={<CheckCircle className="h-3 w-3" />} label="Done" onClick={() => handleStatusChange('completed')} />
            </>
          )}
          {activity.status === 'completed' && (
            <ActionButton icon={<RefreshCcw className="h-3 w-3" />} label="Revert" onClick={() => handleStatusChange('planned')} />
          )}
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-xs font-medium transition-colors"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
