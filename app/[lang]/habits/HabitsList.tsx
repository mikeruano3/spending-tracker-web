'use client'

import { useRef, useState, useTransition } from 'react'
import { PencilSimpleIcon, TrashIcon, CheckIcon, XIcon } from '@phosphor-icons/react'
import { createHabitAction, updateHabitAction, deleteHabitAction } from './actions'
import type { Habit } from '@/lib/db/habits'
import type en from '@/dictionaries/en.json'

type ListDict = typeof en['habits']['list']

interface HabitsListProps {
  habits: Habit[]
  dict: ListDict
}

export default function HabitsList({ habits, dict }: HabitsListProps) {
  const [creating, startCreate] = useTransition()
  const [createError, setCreateError] = useState<string | undefined>()
  const formRef = useRef<HTMLFormElement>(null)

  function handleCreate(formData: FormData) {
    startCreate(async () => {
      const result = await createHabitAction({}, formData)
      if (result.error) {
        setCreateError(result.error)
      } else {
        setCreateError(undefined)
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={handleCreate} className="flex gap-2">
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder={dict.namePlaceholder}
          className="flex-1 border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={creating}
          className="border border-border bg-foreground px-4 py-2 font-mono text-sm text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {creating ? dict.adding : dict.add}
        </button>
      </form>
      {createError && (
        <p className="font-mono text-xs text-destructive">{createError}</p>
      )}

      {habits.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">{dict.empty}</p>
      ) : (
        <ul className="flex flex-col">
          {habits.map((h) => (
            <HabitRow key={h.id} habit={h} dict={dict} />
          ))}
        </ul>
      )}
    </div>
  )
}

function HabitRow({ habit, dict }: { habit: Habit; dict: ListDict }) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await updateHabitAction({}, formData)
      if (result.error) {
        setError(result.error)
      } else {
        setError(undefined)
        setEditing(false)
      }
    })
  }

  function handleDelete(formData: FormData) {
    if (!confirm(dict.deleteConfirm)) return
    startTransition(async () => {
      const result = await deleteHabitAction({}, formData)
      if (result.error) setError(result.error)
    })
  }

  return (
    <li className="flex items-center gap-2 border-b border-border py-3 last:border-b-0">
      {editing ? (
        <form action={handleSave} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="id" value={habit.id} />
          <input
            name="name"
            type="text"
            defaultValue={habit.name}
            maxLength={80}
            required
            autoFocus
            className="flex-1 border border-border bg-background px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={pending}
            title={dict.save}
            className="border border-border p-1.5 hover:bg-muted disabled:opacity-50"
          >
            <CheckIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setError(undefined)
            }}
            title={dict.cancel}
            className="border border-border p-1.5 hover:bg-muted"
          >
            <XIcon size={16} />
          </button>
        </form>
      ) : (
        <>
          <span className="flex-1 font-mono text-sm">{habit.name}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            title={dict.edit}
            className="border border-border p-1.5 hover:bg-muted"
          >
            <PencilSimpleIcon size={16} />
          </button>
          <form action={handleDelete}>
            <input type="hidden" name="id" value={habit.id} />
            <button
              type="submit"
              disabled={pending}
              title={dict.delete}
              className="border border-border p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <TrashIcon size={16} />
            </button>
          </form>
        </>
      )}
      {error && (
        <span className="font-mono text-xs text-destructive">{error}</span>
      )}
    </li>
  )
}
