'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { getCurrentUserId } from '@/lib/auth';

type Internship = {
  id: string;
  company: string;
  institute: string;
  companyMentor?: string;
  instituteMentor?: string;
  totalHours?: number;
  startDate: string;
  endDate: string;
};

const PROFILE_STORAGE_KEY = 'semstress.profile.v1';

function getProfileStorageKey(userId?: string | null) {
  if (!userId) return null;
  return `${PROFILE_STORAGE_KEY}.${userId}`;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [course, setCourse] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [classGroup, setClassGroup] = useState('');

  const [company, setCompany] = useState('');
  const [institute, setInstitute] = useState('');
  const [companyMentor, setCompanyMentor] = useState('');
  const [instituteMentor, setInstituteMentor] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadInternship();
    setCurrentUserId(getCurrentUserId());
  }, []);

  useEffect(() => {
    loadProfileDraft(currentUserId);
  }, [currentUserId]);

  async function loadInternship() {
    try {
      const data: Internship = await apiFetch('/internship');
      if (data) {
        setCompany(data.company);
        setInstitute(data.institute);
        setCompanyMentor(data.companyMentor || '');
        setInstituteMentor(data.instituteMentor || '');
        setTotalHours(data.totalHours?.toString() || '');
        setStartDate(data.startDate.split('T')[0]);
        setEndDate(data.endDate.split('T')[0]);
      }
    } catch (err) {
      // Internship não existe ainda
    }
  }

  function resetProfileDraft() {
    setAvatarPreview('');
    setDisplayName('');
    setUsername('');
    setHeadline('');
    setLocation('');
    setPublicEmail('');
    setWebsite('');
    setGithub('');
    setLinkedin('');
    setCourse('');
    setStudentNumber('');
    setClassGroup('');
  }

  function loadProfileDraft(userId?: string | null) {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = getProfileStorageKey(userId);
      if (!storageKey) {
        resetProfileDraft();
        return;
      }
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        resetProfileDraft();
        return;
      }
      const saved = JSON.parse(raw);
      setAvatarPreview(saved.avatarPreview || '');
      setDisplayName(saved.displayName || '');
      setUsername(saved.username || '');
      setHeadline(saved.headline || '');
      setLocation(saved.location || '');
      setPublicEmail(saved.publicEmail || '');
      setWebsite(saved.website || '');
      setGithub(saved.github || '');
      setLinkedin(saved.linkedin || '');
      setCourse(saved.course || '');
      setStudentNumber(saved.studentNumber || '');
      setClassGroup(saved.classGroup || '');
    } catch (err) {
      // Ignorar dados inválidos
      resetProfileDraft();
    }
  }

  function persistProfileDraft() {
    if (typeof window === 'undefined') return;
    const storageKey = getProfileStorageKey(currentUserId);
    if (!storageKey) return;
    const payload = {
      avatarPreview,
      displayName,
      username,
      headline,
      location,
      publicEmail,
      website,
      github,
      linkedin,
      course,
      studentNumber,
      classGroup,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  function handleAvatarChange(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Escolhe uma imagem válida');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Imagem demasiado grande (máx. 4MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  const profileCompletion = useMemo(() => {
    const fields = [
      avatarPreview,
      displayName,
      username,
      headline,
      location,
      website,
      course,
      studentNumber,
    ];
    const filled = fields.filter((value) => value && value.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [
    avatarPreview,
    displayName,
    username,
    headline,
    location,
    website,
    course,
    studentNumber,
  ]);

  async function submit() {
    if (!displayName.trim()) {
      setError('Preenche o nome completo');
      return;
    }

    if (!username.trim()) {
      setError('Username deve ser preenchido');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username deve ter pelo menos 3 caracteres');
      return;
    }

    if (!company.trim() || !institute.trim() || !startDate || !endDate) {
      setError('Preenche os campos obrigatórios do estágio');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await apiFetch('/internship', {
        method: 'POST',
        body: JSON.stringify({
          company,
          institute,
          companyMentor: companyMentor || undefined,
          instituteMentor: instituteMentor || undefined,
          totalHours: totalHours ? parseInt(totalHours) : undefined,
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
        }),
      });

      persistProfileDraft();

      setLoading(false);
      setSuccess('Perfil e dados de estágio guardados!');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao guardar');
    }
  }

  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />

        <main className="app-main">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* HEADER */}
            <header className="mb-8">
              <h1 className="text-3xl font-semibold">Perfil</h1>
              <p className="text-gray-500 mt-1">Constrói um perfil completo, profissional e com a tua personalidade.</p>
            </header>

            {/* MESSAGES */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="space-y-6">
              {/* HERO */}
              <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700" />
                <div className="px-6 pb-6">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 -mt-12">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-semibold text-gray-400">
                              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-xs p-2 rounded-full cursor-pointer shadow-lg hover:bg-gray-800 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                          />
                        </label>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Perfil pessoal</p>
                        <h2 className="text-2xl font-semibold text-gray-900">
                          {displayName || 'O teu nome completo'}
                        </h2>
                        <p className="text-gray-500">{headline || 'Título profissional ou objetivo'}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
                          <span>{location || 'Localização'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{publicEmail || 'Email público'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-72 space-y-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Perfil completo</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-2xl font-semibold text-gray-900">{profileCompletion}%</span>
                          <span className="text-xs text-gray-500">Quanto mais completo, melhor</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-gray-900"
                            style={{ width: `${profileCompletion}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-900">Dica rápida</p>
                        <p className="mt-1">Preenche o resumo e competências para receber sugestões mais relevantes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* IDENTIDADE */}
                  <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Identidade essencial</h3>
                      <span className="text-xs text-gray-500">* campos obrigatórios</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome completo <span className="text-gray-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Mariana Sousa"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username <span className="text-gray-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: mariana.dev"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título profissional
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Estudante de Engenharia Informática"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Localização
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Lisboa, PT"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </section>

                  {/* CONTACTO */}
                  <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Contacto & links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email público</label>
                        <input
                          type="email"
                          placeholder="Ex: mariana@email.com"
                          value={publicEmail}
                          onChange={(e) => setPublicEmail(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          placeholder="Ex: https://teuportfolio.com"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                        <input
                          type="text"
                          placeholder="Ex: github.com/mariana"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                        <input
                          type="text"
                          placeholder="Ex: linkedin.com/in/mariana"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </section>


                  {/* ESTÁGIO */}
                  <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Dados do estágio</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome da Empresa <span className="text-gray-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: TechCorp"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Orientador na Empresa</label>
                          <input
                            type="text"
                            placeholder="Nome do orientador (opcional)"
                            value={companyMentor}
                            onChange={(e) => setCompanyMentor(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Instituto <span className="text-gray-400">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: ISCTE"
                            value={institute}
                            onChange={(e) => setInstitute(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Orientador no Instituto</label>
                          <input
                            type="text"
                            placeholder="Nome do orientador (opcional)"
                            value={instituteMentor}
                            onChange={(e) => setInstituteMentor(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Início <span className="text-gray-400">*</span>
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Fim <span className="text-gray-400">*</span>
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total de Horas Previstas</label>
                        <input
                          type="number"
                          placeholder="Ex: 500 horas (opcional)"
                          value={totalHours}
                          onChange={(e) => setTotalHours(e.target.value)}
                          min="1"
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Total de horas que deves cumprir no estágio</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  {/* DADOS ACADÉMICOS */}
                  <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Dados académicos</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Curso</label>
                        <input
                          type="text"
                          placeholder="Ex: Engenharia Informática"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nº de estudante</label>
                        <input
                          type="text"
                          placeholder="Ex: 202300123"
                          value={studentNumber}
                          onChange={(e) => setStudentNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Turma</label>
                        <input
                          type="text"
                          placeholder="Ex: EI-3A"
                          value={classGroup}
                          onChange={(e) => setClassGroup(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </section>


                  {/* IMAGEM */}
                  <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Imagem de perfil</h3>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Faz upload de uma imagem para personalizar o teu perfil. Guardamos localmente no teu navegador.
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium cursor-pointer">
                          Selecionar imagem
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                          />
                        </label>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={() => setAvatarPreview('')}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-gray-500">Última atualização: agora mesmo</p>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="bg-gray-900 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'A guardar…' : 'Guardar Perfil'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
