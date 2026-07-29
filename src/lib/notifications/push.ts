import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

type WorkspacePush = { workspaceId: string; actorId: string; title: string; body: string; url?: string }

export async function notifyWorkspaceMembers({ workspaceId, actorId, title, body, url = '/' }: WorkspacePush) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const contact = process.env.VAPID_SUBJECT ?? 'mailto:hello@pairup.app'
  if (!publicKey || !privateKey) return

  webpush.setVapidDetails(contact, publicKey, privateKey)
  const admin = createAdminClient().schema('paired')
  const { data: memberships } = await admin.from('workspace_members').select('user_id').eq('workspace_id', workspaceId)
  const recipientIds = (memberships ?? []).map((member) => member.user_id).filter((id) => id !== actorId)
  if (!recipientIds.length) return

  const { data: subscriptions } = await admin.from('push_subscriptions').select('endpoint,p256dh,auth').in('user_id', recipientIds)
  const payload = JSON.stringify({ title, body, url, tag: `workspace-${workspaceId}` })

  await Promise.allSettled((subscriptions ?? []).map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload)
    } catch (error) {
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 0
      if (statusCode === 404 || statusCode === 410) await admin.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    }
  }))
}