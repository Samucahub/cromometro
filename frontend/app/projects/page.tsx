'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';
import { Plus, Folder } from 'lucide-react';

type Project = {
  id: string;
  title: string;
  description?: string;
  color: string;
  isCollaborative: boolean;
  _count?: { members: number; tasks: number };
};

type Invitation = {
  id: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  project: { id: string; title: string; description?: string };
  invitedBy: { id: string; name: string; email: string };
};

type LeadershipTransfer = {
  id: string;
  project: { id: string; title: string; description?: string };
  fromUser: { id: string; name: string; email: string };
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [leadershipTransfers, setLeadershipTransfers] = useState<LeadershipTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const [projectsData, invitesData, transfersData] = await Promise.all([
        apiFetch('/projects/collaborative/accessible'),
        apiFetch('/projects/invitations/pending'),
        apiFetch('/projects/leadership-transfers/pending'),
      ]);
      setProjects(projectsData);
      setInvitations(invitesData);
      setLeadershipTransfers(transfersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const collaborativeProjects = useMemo(
    () => projects.filter((p) => p.isCollaborative),
    [projects],
  );
  const uniqueCollaborativeProjects = useMemo(
    () =>
      Array.from(
        new Map(collaborativeProjects.map((project) => [project.id, project])).values(),
      ),
    [collaborativeProjects],
  );

  async function respondToInvite(invitationId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      setLoadingInvites(true);
      await apiFetch('/projects/invitations/respond', {
        method: 'POST',
        body: JSON.stringify({ invitationId, status }),
      });
      await loadProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingInvites(false);
    }
  }

  async function respondToLeadershipTransfer(transferId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      setLoadingTransfers(true);
      await apiFetch('/projects/leadership-transfers/respond', {
        method: 'POST',
        body: JSON.stringify({ transferId, status }),
      });
      await loadProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingTransfers(false);
    }
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main bg-white min-h-screen">
            <div className="max-w-[1200px] mx-auto px-8 py-8">
              {/* Header */}
              <header className="mb-12 flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Projetos Colaborativos</h1>
                  <p className="text-gray-500 mt-2">Trabalhe em equipa em projetos compartilhados</p>
                </div>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gray-900 hover:bg-gray-800 flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Novo Projeto
                </Button>
              </header>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Invitations */}
              {invitations.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Convites pendentes</h2>
                  <div className="space-y-3">
                    {invitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm text-gray-500">Projeto</div>
                          <div className="text-base font-semibold text-gray-900">
                            {invite.project.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Convidado por {invite.invitedBy.name} ({invite.invitedBy.email})
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToInvite(invite.id, 'DECLINED')}
                            disabled={loadingInvites}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => respondToInvite(invite.id, 'ACCEPTED')}
                            disabled={loadingInvites}
                            className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Aceitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leadership Transfers */}
              {leadershipTransfers.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pedidos de liderança</h2>
                  <div className="space-y-3">
                    {leadershipTransfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="bg-white border border-amber-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm text-amber-700">Projeto</div>
                          <div className="text-base font-semibold text-gray-900">
                            {transfer.project.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Pedido por {transfer.fromUser.name} ({transfer.fromUser.email})
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToLeadershipTransfer(transfer.id, 'DECLINED')}
                            disabled={loadingTransfers}
                            className="px-3 py-2 text-sm rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => respondToLeadershipTransfer(transfer.id, 'ACCEPTED')}
                            disabled={loadingTransfers}
                            className="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                          >
                            Aceitar liderança
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {uniqueCollaborativeProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Folder className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Inicie o seu primeiro projeto
                  </h3>
                  <p className="text-gray-600 mb-8 text-center max-w-md">
                    Crie um projeto colaborativo para trabalhar em equipa, atribuir tarefas e
                    acompanhar o progresso
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gray-900 hover:bg-gray-800 flex items-center gap-2 px-6 py-3"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeiro Projeto
                  </Button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 text-sm font-semibold text-gray-700">
                    Projetos
                  </div>
                  <div className="divide-y divide-gray-200">
                    {uniqueCollaborativeProjects.map((project) => (
                      <div key={project.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <div className="text-base font-semibold text-gray-900">{project.title}</div>
                          {project.description && (
                            <div className="text-sm text-gray-500">{project.description}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {project._count?.tasks || 0} tarefa(s)
                          </div>
                        </div>
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                        >
                          Abrir
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Create Project Dialog */}
        {showCreateDialog && (
          <CreateProjectDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {
              setShowCreateDialog(false);
              loadProjects();
            }}
          />
        )}
      </InternshipCheck>
    </ProtectedRoute>
  );
}

function CreateProjectDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function searchUsers(query: string) {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const results = await apiFetch(`/users/search?q=${encodeURIComponent(query)}`);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (err) {
      setSuggestions([]);
    }
  }

  function handleMemberInputChange(value: string) {
    setMemberInput(value);
    searchUsers(value);
  }

  function addMember(email: string) {
    if (email && !members.includes(email)) {
      setMembers([...members, email]);
      setMemberInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function addMemberFromInput() {
    if (memberInput.trim() && !members.includes(memberInput.trim())) {
      setMembers([...members, memberInput.trim()]);
      setMemberInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function removeMember(member: string) {
    setMembers(members.filter((m) => m !== member));
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Nome do projeto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      await apiFetch('/projects/collaborative/create', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          memberEmails: members,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-[600px] shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Criar Novo Projeto</h3>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Projeto *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Website Redesign"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo do projeto..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Membros da Equipa
            </label>
            <div className="flex gap-2 mb-3 relative">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={memberInput}
                  onChange={(e) => handleMemberInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMemberFromInput()}
                  onFocus={() => memberInput.length > 0 && setShowSuggestions(true)}
                  placeholder="Nome ou email do utilizador..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {suggestions.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addMember(user.email)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={addMemberFromInput}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-all"
              >
                Adicionar
              </button>
            </div>

            {members.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <div
                    key={member}
                    className="bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {member}
                    <button
                      onClick={() => removeMember(member)}
                      className="text-gray-500 hover:text-gray-700 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        </div>
      </div>
    </div>
  );
}
