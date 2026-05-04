'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'

type ActionFn = (state: { error?: string; success?: boolean }, formData: FormData) => Promise<{ error?: string; success?: boolean }>

export default function DeleteConfirmDialog({
  action,
  hiddenFields,
  label = 'Delete',
  message = 'This action cannot be undone.',
}: {
  action: ActionFn
  hiddenFields: Record<string, string>
  label?: string
  message?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(action, {})

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-none px-2 font-mono text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Confirm deletion</DialogTitle>
        </DialogHeader>
        <p className="font-mono text-xs text-muted-foreground">{message}</p>
        {state.error && (
          <p className="font-mono text-xs text-destructive">{state.error}</p>
        )}
        <DialogFooter>
          <form action={formAction} className="flex gap-2 justify-end">
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none font-mono"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={pending}
              className="rounded-none font-mono"
            >
              {pending ? 'Deleting...' : 'Delete'}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
