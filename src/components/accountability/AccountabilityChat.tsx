'use client'

import * as React from 'react'
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock, Heart } from 'lucide-react'
import { addFeedbackAction } from '@/actions/work'

interface AccountabilityChatProps {
  workspaceId: string
  entityId: string
  entityType: 'task_id' | 'project_id' | 'goal_id' | 'task_group_id'
  feedbacks: any[]
  currentUserId: string
  hideHeader?: boolean
}

export function AccountabilityChat({ workspaceId, entityId, entityType, feedbacks: initialFeedbacks, currentUserId, hideHeader = false }: AccountabilityChatProps) {
  const [feedbacks, setFeedbacks] = React.useState(initialFeedbacks)
  const [message, setMessage] = React.useState('')
  const [kind, setKind] = React.useState('update')
  const [pending, setPending] = React.useState(false)

  // Update internal state if initial props change (e.g. initial load completes)
  React.useEffect(() => {
    setFeedbacks(initialFeedbacks)
  }, [initialFeedbacks])

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [feedbacks])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setPending(true)
    const formData = new FormData()
    formData.append('workspaceId', workspaceId)
    formData.append(entityType, entityId)
    formData.append('message', message)
    formData.append('kind', kind)
    
    await addFeedbackAction(formData)
    
    setMessage('')
    setPending(false)
  }

  const getKindIcon = (k: string) => {
    switch (k) {
      case 'question': return <AlertCircle className="size-4 text-orange-500" />
      case 'nudge': return <Clock className="size-4 text-blue-500" />
      case 'update': return <CheckCircle2 className="size-4 text-emerald-500" />
      case 'encouragement': return <Heart className="size-4 text-pink-500" />
      default: return <MessageSquare className="size-4 text-gray-500" />
    }
  }

  return (
    <div className={`flex flex-col bg-card rounded-2xl border border-border shadow-sm h-full min-h-500px ${hideHeader ? 'border-none shadow-none rounded-none' : ''}`}>
      {!hideHeader && (
        <div className="p-4 border-b border-border bg-muted/30 rounded-t-2xl flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <MessageSquare className="size-5 text-blue-600" />
            Accountability Log
          </h3>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {feedbacks.length} messages
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {feedbacks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="size-8 mb-2 opacity-20" />
            <p className="text-sm">No updates yet. Start the conversation!</p>
          </div>
        ) : (
          feedbacks.map((fb) => {
            const isMe = fb.author_id === currentUserId
            return (
              <div key={fb.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {fb.profiles?.display_name || 'Partner'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                  <div className="flex items-start gap-2">
                    {!isMe && <div className="mt-0.5 bg-white/50 dark:bg-black/20 p-1 rounded-md shrink-0">{getKindIcon(fb.kind)}</div>}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{fb.message}</p>
                    {isMe && <div className="mt-0.5 bg-black/20 p-1 rounded-md shrink-0">{getKindIcon(fb.kind)}</div>}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-muted/10 rounded-b-2xl">
        <div className="flex items-center gap-2 mb-2">
          <select 
            value={kind} 
            onChange={(e) => setKind(e.target.value)}
            className="text-xs h-8 rounded-lg border-border bg-transparent px-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="update">Progress Update</option>
            <option value="question">Ask a Question</option>
            <option value="nudge">Nudge / Follow up</option>
            <option value="encouragement">Encouragement</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add an update or hold accountable..."
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
