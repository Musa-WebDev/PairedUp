import * as React from 'react'
import { ActivityCard } from './ActivityCard'
import type { Activity, ActivityStatus } from '@/types/activities'

////////////////////////////////////////////////////////////////////////////////
// COMPONENT
////////////////////////////////////////////////////////////////////////////////

interface ActivitiesBoardProps {
  activities: (Activity & { profiles: { display_name: string | null, avatar_url: string | null } | null })[]
}

export function ActivitiesBoard({ activities }: ActivitiesBoardProps) {
  const suggested = activities.filter(a => a.status === 'suggested')
  const planned = activities.filter(a => a.status === 'planned')
  const completed = activities.filter(a => a.status === 'completed')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <Column title="Suggested" count={suggested.length} items={suggested} />
      <Column title="Planned" count={planned.length} items={planned} />
      <Column title="Completed" count={completed.length} items={completed} />
    </div>
  )
}

function Column({ title, count, items }: { title: string, count: number, items: any[] }) {
  return (
    <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-4 min-h-[500px] border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <span className="bg-white dark:bg-black text-xs font-medium px-2 py-1 rounded-full border shadow-sm">
          {count}
        </span>
      </div>
      
      <div className="flex flex-col gap-3 flex-1">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            No items yet
          </div>
        ) : (
          items.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  )
}
