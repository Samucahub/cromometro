const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { Document, CreateDocumentDto, UpdateDocumentDto } from './types';

export async function apiFetch(
  path: string,
  options: RequestInit = {},
) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Erro inesperado');
  }

  return res.json();
}

// Documents API
export const documentsApi = {
  // Get all documents (optionally filtered by project or task)
  getAll: async (filters?: { projectId?: string; taskId?: string }): Promise<Document[]> => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.taskId) params.append('taskId', filters.taskId);
    
    const query = params.toString();
    return apiFetch(`/documents${query ? `?${query}` : ''}`);
  },

  // Get a single document by ID
  getOne: async (id: string): Promise<Document> => {
    return apiFetch(`/documents/${id}`);
  },

  // Create a new document
  create: async (data: CreateDocumentDto): Promise<Document> => {
    return apiFetch('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update an existing document
  update: async (id: string, data: UpdateDocumentDto): Promise<Document> => {
    return apiFetch(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete a document
  delete: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};
