'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { deleteGroupAction } from './actions'

export default function DeleteGroupDialog({
  groupId,
  groupName,
  lang,
}: {
  groupId: string
  groupName: string
  lang: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [state, formAction, pending] = useActionState(deleteGroupAction, {})

  useEffect(() => {
    if (state.success) {
      setOpen(false)
      router.push(`/${lang}/groups`)
    }
  }, [state.success, lang, router])

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) setConfirmation('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-none px-2 font-mono text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Delete &quot;{groupName}&quot;</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            This will permanently delete the group, all its expenses, splits, and settlements. This action cannot be undone.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Type <span className="text-foreground">delete</span> to confirm
            </label>
            <Input
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
              placeholder="delete"
              className="rounded-none font-mono text-xs"
              autoComplete="off"
            />
          </div>
          {state.error && (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          )}
        </div>
        <DialogFooter>
          <form action={formAction} className="flex gap-2 justify-end">
            <input type="hidden" name="groupId" value={groupId} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none font-mono"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={confirmation !== 'delete' || pending}
              className="rounded-none font-mono"
            >
              {pending ? 'Deleting...' : 'Delete Group'}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
