'use client'

import * as React from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { sendWorkspaceMessageAction } from '@/actions/chat'
import { createClient } from '@/lib/supabase/client'

interface WorkspaceChatProps {
  workspaceId: string
  currentUserId: string
  initialMessages: any[]
}

export function WorkspaceChat({ workspaceId, currentUserId, initialMessages }: WorkspaceChatProps) {
  const [messages, setMessages] = React.useState(initialMessages)
  const [message, setMessage] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('workspace_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'paired',
          table: 'workspace_messages',
          filter: `workspace_id=eq.${workspaceId}`
        },
        async (payload) => {
          // Fetch the profile for the new message to get the display name
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', payload.new.author_id)
            .single()

          const newMsg = {
            ...(payload.new as any),
            profiles: profileData
          }

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || pending) return

    setPending(true)
    const formData = new FormData()
    formData.append('workspaceId', workspaceId)
    formData.append('message', message)
    
    try {
      await sendWorkspaceMessageAction(formData)
      setMessage('')
    } catch (err) {
      console.error(err)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col bg-card rounded-2xl border border-border shadow-sm h-full">
      <div className="p-4 border-b border-border bg-muted/30 rounded-t-2xl flex items-center justify-between shrink-0">
        <h3 className="font-bold flex items-center gap-2">
          <MessageSquare className="size-5 text-blue-600" />
          General Chat
        </h3>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {messages.length} messages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="size-8 mb-2 opacity-20" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.author_id === currentUserId
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {msg.profiles?.display_name || 'Member'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-muted/10 rounded-b-2xl shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 max-h-32 min-h-44px rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={pending || !message.trim()}
            className="h-44px w-44px shrink-0 grid place-items-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
