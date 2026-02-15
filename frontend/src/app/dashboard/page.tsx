'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/ui/Card';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';

type Task = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

export default function DashboardPage() {
  const [weekHours, setWeekHours] = useState<number>(0);
  const [todayHours, setTodayHours] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadSummary();
    loadTasks();
  }, []);

  async function loadSummary() {
    const data = await apiFetch('/reports/summary');
    setWeekHours(data.weekHours);
    setTodayHours(data.todayHours);
  }

  async function loadTasks() {
    const data = await apiFetch('/tasks?status=IN_PROGRESS');
    setTasks(data);
  }

  return (
    <ProtectedRoute>
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* HEADER */}
        <header>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Resumo rápido da tua semana
          </p>
        </header>

        {/* SUMMARY */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm text-gray-500">Horas esta semana</p>
            <p className="text-3xl font-semibold mt-2">
              {weekHours}h
            </p>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">Hoje</p>
            <p className="text-3xl font-semibold mt-2">
              {todayHours}h
            </p>
          </Card>
        </section>

        {/* ACTIVE TASKS */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Tarefas em progresso</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500">Nenhuma tarefa em progresso</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <div className="flex justify-between items-center">
                    <span>{task.title}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {task.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
