'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { getCurrentUserId } from '@/lib/auth';

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
};

type ConfirmDialogState = {
  isOpen: boolean;
  userId?: string;
  userName?: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setError('');
      const data = await apiFetch('/admin/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Acesso negado');
    }
  }

  async function updateRole(userId: string, role: User['role']) {
    try {
      setError('');
      setLoading(true);
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setLoading(false);
      loadUsers();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao atualizar role');
    }
  }

  function openDeleteConfirm(userId: string, userName: string) {
    setConfirmDialog({ isOpen: true, userId, userName });
  }

  function closeDeleteConfirm() {
    setConfirmDialog({ isOpen: false });
  }

  async function confirmDelete() {
    if (!confirmDialog.userId) return;

    try {
      setError('');
      setLoading(true);
      await apiFetch(`/admin/users/${confirmDialog.userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmed: true }),
      });
      setLoading(false);
      closeDeleteConfirm();
      loadUsers();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao remover utilizador');
    }
  }

  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />

        <main className="app-main">
          <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
            <header>
              <h1 className="text-3xl font-semibold">Admin</h1>
              <p className="text-gray-500 mt-1">Gerir utilizadores do sistema</p>
            </header>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b">
                      <th className="py-2">Nome</th>
                      <th className="py-2">Username</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Criado</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2">{u.name}</td>
                        <td className="py-2 font-mono text-xs text-gray-600">@{u.username}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2">
                          <select
                            value={u.role}
                            disabled={loading}
                            onChange={(e) => updateRole(u.id, e.target.value as User['role'])}
                            className="border rounded px-2 py-1"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="py-2">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 text-right">
                          {u.id !== currentUserId ? (
                            <Button
                              onClick={() => openDeleteConfirm(u.id, u.username)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={loading}
                            >
                              Remover
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Sua conta</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal de Confirmação */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Confirmar Eliminação</h2>
              <p className="text-gray-700">
                Tens a certeza que queres eliminar o utilizador <strong>@{confirmDialog.userName}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta ação é irreversível e irá apagar todos os dados associados.
              </p>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  onClick={closeDeleteConfirm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'A eliminar...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
