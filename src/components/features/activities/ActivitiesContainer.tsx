import { getActivities } from '@/actions/activities'
import { ActivitiesBoard } from './ActivitiesBoard'

export default async function ActivitiesContainer() {
  const activities = await getActivities()
  
  return <ActivitiesBoard activities={activities as any} />
}
