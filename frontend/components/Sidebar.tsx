'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRole, logout } from '@/lib/auth';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  BarChart3,
  User,
  Shield,
  LogOut,
  Folder,
  FileText,
} from 'lucide-react';

export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setRole(getRole());
  }, []);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/simple-tasks', label: 'Tarefas', icon: CheckSquare },
    { href: '/projects', label: 'Projetos', icon: Folder },
    { href: '/documents', label: 'Documentos', icon: FileText },
    { href: '/time-entries', label: 'Horas', icon: Clock },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/profile', label: 'Perfil', icon: User },
  ];

  if (role === 'ADMIN') {
    links.push({ href: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6">
      {/* Logo */}
      <div className="mb-8 relative group">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
          <span className="text-gray-700 font-bold text-lg">S</span>
        </div>
        <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          SEMSTRESS
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full flex flex-col items-center gap-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <div
              key={link.href}
              className="relative group"
              onMouseEnter={() => setHoveredItem(link.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={link.href}
                className={`
                  w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-6 h-6" />
              </Link>
              
              {/* Tooltip */}
              <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-gray-700">
                {link.label}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="relative group">
        <button
          onClick={logout}
          className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        >
          <LogOut className="w-6 h-6" />
        </button>
        <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-gray-700">
          Sair
        </div>
      </div>
    </aside>
  );
}
