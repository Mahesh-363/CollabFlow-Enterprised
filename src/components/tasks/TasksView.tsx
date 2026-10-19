import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  MoreVertical,
  Trash2,
  ArrowRight,
  User,
} from 'lucide-react';
import { useCollabStore } from '../../store/useCollabStore';
import { UserAvatar } from '../UserAvatar';
import { Task, TaskStatus, TaskPriority } from '../../types/collab';
import { filterTasks, calculateTaskMetrics } from '../../utils/collabSuiteLogic';
import { getRelativeDateStr } from '../../utils/dateClock';

export const TasksView: React.FC = () => {
  const {
    tasks,
    users,
    currentUser,
    createTask,
    updateTaskStatus,
    toggleSubtask,
    deleteTask,
  } = useCollabStore();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New task form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formAssigneeId, setFormAssigneeId] = useState(currentUser.id);
  const [formDueDate, setFormDueDate] = useState(() => getRelativeDateStr(4));
  const [formTags, setFormTags] = useState('Frontend, A11y');
  const [formSubtasksText, setFormSubtasksText] = useState('Task Item 1\nTask Item 2');

  const filteredTasks = filterTasks(tasks, {
    assigneeId: filterAssignee,
    priority: filterPriority,
    search: searchQuery,
  });

  const metrics = calculateTaskMetrics(tasks);

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'border-slate-700' },
    { id: 'in_progress', label: 'In Progress', color: 'border-indigo-500' },
    { id: 'in_review', label: 'In Review', color: 'border-amber-500' },
    { id: 'done', label: 'Completed', color: 'border-emerald-500' },
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const subtasks = formSubtasksText
      .split('\n')
      .map((line, idx) => ({ id: `st-${Date.now()}-${idx}`, title: line.trim(), completed: false }))
      .filter((s) => s.title.length > 0);

    const tags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    createTask({
      title: formTitle.trim(),
      description: formDesc.trim(),
      status: 'todo',
      priority: formPriority,
      assigneeId: formAssigneeId,
      creatorId: currentUser.id,
      dueDate: formDueDate,
      tags,
      subtasks,
    });

    setIsCreateModalOpen(false);
    setFormTitle('');
    setFormDesc('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5">
      {/* HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <span>Tasks & Projects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kanban boards, sprint backlogs, subtask checklists, and cross-team deadlines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* PROGRESS BAR & SUMMARY */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              Workspace Sprint Progress: {metrics.completionRate}%
            </span>
            <span className="text-slate-400 font-mono">
              {metrics.completed} of {metrics.total} tasks completed
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <span className="text-slate-300">To Do: {metrics.todo}</span>
          <span className="text-indigo-400">In Progress: {metrics.inProgress}</span>
          <span className="text-emerald-400">Done: {metrics.completed}</span>
          {metrics.overdue > 0 && (
            <span className="text-rose-400 font-bold">{metrics.overdue} Overdue</span>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, tags..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start min-h-[500px]">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-3.5 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List in Column */}
                <div className="space-y-3 min-h-[100px]">
                  {colTasks.map((task) => {
                    const assignee = users.find((u) => u.id === task.assigneeId);
                    const isDone = task.status === 'done';

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-sm group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                              task.priority === 'urgent'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                                : task.priority === 'high'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : task.priority === 'medium'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h3 className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                        )}

                        {/* Subtasks Progress */}
                        {task.subtasks.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {task.subtasks.map((st) => (
                              <button
                                key={st.id}
                                onClick={() => toggleSubtask(task.id, st.id)}
                                className="w-full flex items-center gap-2 text-[10px] text-left text-slate-400 hover:text-slate-200"
                              >
                                {st.completed ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                ) : (
                                  <div className="w-3 h-3 rounded-xs border border-slate-600 shrink-0" />
                                )}
                                <span className={st.completed ? 'line-through text-slate-500' : ''}>
                                  {st.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: Due date & Assignee & Quick Move */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.dueDate}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Next status quick advance */}
                            {col.id !== 'done' && (
                              <button
                                onClick={() => {
                                  const nextStatus: Record<TaskStatus, TaskStatus> = {
                                    todo: 'in_progress',
                                    in_progress: 'in_review',
                                    in_review: 'done',
                                    done: 'done',
                                  };
                                  updateTaskStatus(task.id, nextStatus[col.id]);
                                }}
                                className="text-indigo-400 hover:text-indigo-300 font-semibold"
                                title="Advance status"
                              >
                                Move →
                              </button>
                            )}

                            {assignee && <UserAvatar user={assignee} size="xs" showPresence={false} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden divide-y divide-slate-800">
          {filteredTasks.map((task) => {
            const assignee = users.find((u) => u.id === task.assigneeId);
            const isDone = task.status === 'done';

            return (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() =>
                      updateTaskStatus(task.id, isDone ? 'todo' : 'done')
                    }
                    className="text-slate-500 hover:text-emerald-400 shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-md border border-slate-500" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`font-bold truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                    className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>

                  <span className="text-[11px] text-slate-400 font-mono">{task.dueDate}</span>
                  {assignee && <UserAvatar user={assignee} size="xs" showPresence={false} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>Create New Task</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Implement WebRTC signaling reconnect backoff"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Task context, requirements, and acceptance criteria"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assignee</label>
                  <select
                    value={formAssigneeId}
                    onChange={(e) => setFormAssigneeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="WebRTC, Networking, Backend"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtasks (one per line)</label>
                <textarea
                  rows={2}
                  value={formSubtasksText}
                  onChange={(e) => setFormSubtasksText(e.target.value)}
                  placeholder="Write unit test&#10;Verify failover under load"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
