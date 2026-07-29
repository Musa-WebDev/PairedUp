import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProtectedShell } from '@/components/auth/ProtectedShell'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { WorkspaceChat } from '@/components/chat/WorkspaceChat'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { activeWorkspaceId } = await getWorkspaceContext()
  if (!activeWorkspaceId) {
    return (
      <ProtectedShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Select a workspace to view chat.</p>
        </div>
      </ProtectedShell>
    )
  }

  // Fetch initial messages
  const { data: messages } = await supabase
    .from('workspace_messages')
    .select('*, profiles!author_id(display_name, avatar_url)')
    .eq('workspace_id', activeWorkspaceId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <ProtectedShell>
      <div className="mx-auto max-w-4xl h-[calc(100vh-8rem)]">
        <WorkspaceChat 
          workspaceId={activeWorkspaceId} 
          currentUserId={user.id} 
          initialMessages={(messages ?? []).reverse()} 
        />
      </div>
    </ProtectedShell>
  )
}
