'use client'

import { useActionState, useEffect, useOptimistic, useRef, useTransition } from 'react'
import Link from 'next/link'
import { TrashIcon, CheckIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  createTodoAction,
  toggleTodoAction,
  deleteTodoAction,
  clearDoneTodosAction,
} from './actions'
import type { Todo } from '@/lib/db/todos'
import type en from '@/dictionaries/en.json'

type TodosDict = typeof en['todos']

interface TodosViewProps {
  lang: string
  dict: TodosDict
  todos: Todo[]
  filter: 'active' | 'done'
}

export default function TodosView({ lang, dict, todos, filter }: TodosViewProps) {
  const [createState, createAction, creating] = useActionState(createTodoAction, {})
  const [, clearAction, clearing] = useActionState(clearDoneTodosAction, {})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (createState.success && inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }, [createState.success])

  const [, startTransition] = useTransition()
  const [optimisticTodos, applyOptimistic] = useOptimistic(
    todos,
    (prev: Todo[], action: { type: 'toggle'; id: string; done: boolean }) =>
      prev.map((t) => (t.id === action.id ? { ...t, isDone: action.done } : t)),
  )

  const visible = optimisticTodos.filter((t) => (filter === 'done' ? t.isDone : !t.isDone))
  const doneCount = optimisticTodos.filter((t) => t.isDone).length

  function handleToggle(id: string, done: boolean) {
    startTransition(async () => {
      applyOptimistic({ type: 'toggle', id, done })
      await toggleTodoAction({ id, done })
    })
  }

  const tabs = [
    { key: 'active' as const, href: `/${lang}/todos?filter=active`, label: dict.tabs.active },
    { key: 'done' as const, href: `/${lang}/todos?filter=done`, label: dict.tabs.done },
  ]

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="font-mono text-2xl font-bold tracking-tight">{dict.title}</h1>

      <form action={createAction} className="flex gap-2">
        <input
          ref={inputRef}
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder={dict.addPlaceholder}
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
      {createState.error && (
        <p className="font-mono text-xs text-destructive">{createState.error}</p>
      )}

      <div className="flex border-b border-border">
        {tabs.map((t) => {
          const isActive = t.key === filter
          return (
            <Link
              key={t.key}
              href={t.href}
              replace
              className={cn(
                '-mb-px border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">
          {optimisticTodos.length === 0
            ? dict.emptyAll
            : filter === 'done'
              ? dict.emptyDone
              : dict.emptyActive}
        </p>
      ) : (
        <ul className="flex flex-col">
          {visible.map((t) => (
            <TodoRow
              key={t.id}
              todo={t}
              dict={dict}
              onToggle={(done) => handleToggle(t.id, done)}
            />
          ))}
        </ul>
      )}

      {filter === 'done' && doneCount > 0 && (
        <form
          action={clearAction}
          onSubmit={(e) => {
            if (!confirm(dict.deleteConfirm)) e.preventDefault()
          }}
        >
          <button
            type="submit"
            disabled={clearing}
            className="border border-border px-3 py-1.5 font-mono text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {dict.clearDone}
          </button>
        </form>
      )}
    </main>
  )
}

function TodoRow({
  todo,
  dict,
  onToggle,
}: {
  todo: Todo
  dict: TodosDict
  onToggle: (done: boolean) => void
}) {
  const [deleteState, deleteAction, deleting] = useActionState(deleteTodoAction, {})

  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(!todo.isDone)}
        aria-pressed={todo.isDone}
        aria-label={todo.title}
        className={cn(
          'flex size-6 shrink-0 items-center justify-center border transition-colors',
          todo.isDone
            ? 'border-foreground bg-foreground text-background'
            : 'border-border hover:border-foreground',
        )}
      >
        {todo.isDone && <CheckIcon size={14} weight="bold" />}
      </button>
      <span
        className={cn(
          'flex-1 font-mono text-sm',
          todo.isDone && 'text-muted-foreground line-through',
        )}
      >
        {todo.title}
      </span>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm(dict.deleteConfirm)) e.preventDefault()
        }}
      >
        <input type="hidden" name="id" value={todo.id} />
        <button
          type="submit"
          disabled={deleting}
          title={dict.delete}
          className="border border-border p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <TrashIcon size={16} />
        </button>
      </form>
      {deleteState.error && (
        <span className="font-mono text-xs text-destructive">{deleteState.error}</span>
      )}
    </li>
  )
}
