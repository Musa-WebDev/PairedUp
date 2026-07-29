'use client'

import * as React from 'react'
import { MessageSquare } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/Modal'
import { AccountabilityChat } from './AccountabilityChat'
import { getFeedbacksAction } from '@/actions/work'

interface AccountabilityModalProps {
  workspaceId: string
  entityId: string
  entityType: 'task_id' | 'project_id' | 'goal_id' | 'task_group_id'
  title: string
}

export function AccountabilityModal({ workspaceId, entityId, entityType, title }: AccountabilityModalProps) {
  const [open, setOpen] = React.useState(false)
  const [feedbacks, setFeedbacks] = React.useState<any[]>([])
  const [currentUserId, setCurrentUserId] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setLoading(true)
      getFeedbacksAction(entityId, entityType)
        .then((res) => {
          setFeedbacks(res.feedbacks)
          setCurrentUserId(res.currentUserId)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, entityId, entityType])

  return (
    <>
      <button 
        type="button"
        onClick={() => setOpen(true)} 
        title="Accountability Chat" 
        className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
      >
        <MessageSquare className="size-5" />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button type="button" aria-label="Close modal" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MessageSquare className="size-5 text-blue-600" />
                  Accountability & Notes
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Discussing: {title}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Loading chat...</span>
                </div>
              ) : (
                <AccountabilityChat 
                  workspaceId={workspaceId}
                  entityId={entityId}
                  entityType={entityType}
                  feedbacks={feedbacks}
                  currentUserId={currentUserId}
                  hideHeader={true}
                />
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )
}
