'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateGroupNameAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

export default function EditGroupNameForm({
  groupId,
  currentName,
}: {
  groupId: string
  currentName: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [state, action, pending] = useActionState(updateGroupNameAction, {})

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  function handleOpenChange(o: boolean) {
    if (o) setName(currentName)
    setOpen(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 rounded-none px-2 font-mono text-xs">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Group Name</DialogTitle>
        </DialogHeader>
        <form action={action} className="mt-2 flex flex-col gap-4">
          <input type="hidden" name="groupId" value={groupId} />
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-xs font-medium">Name</Label>
            <Input
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="rounded-none font-mono"
            />
          </div>
          {state.error && (
            <p className="font-mono text-xs text-destructive">{state.error}</p>
          )}
          <Button
            type="submit"
            disabled={pending || !name.trim()}
            className="rounded-none font-mono"
          >
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
