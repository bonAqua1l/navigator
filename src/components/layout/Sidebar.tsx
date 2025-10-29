import { Home, Building2, Star, Calendar, FileText, Settings, Users, Activity, LogOut, Database, Trash2 } from 'lucide-react';
import navigatorLogo from '@/assets/navigator-house-logo.png';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface SidebarProps {
  onNavigate?: () => void;
}

const navItems: NavItem[] = [
  {
    title: 'Дежурка',
    href: '/dashboard',
    icon: Home,
    roles: ['super_admin', 'manager', 'intern'],
  },
  {
    title: 'Мои объявления',
    href: '/my-properties',
    icon: Building2,
    roles: ['super_admin', 'manager'],
  },
  {
    title: 'Корзина',
    href: '/trash',
    icon: Trash2,
    roles: ['super_admin', 'manager'],
  },
  {
    title: 'Избранные',
    href: '/favorites',
    icon: Star,
    roles: ['super_admin', 'manager', 'intern'],
  },
  {
    title: 'Показы',
    href: '/viewings',
    icon: Calendar,
    roles: ['super_admin', 'manager'],
  },
  {
    title: 'Новостройки',
    href: '/new-buildings',
    icon: Building2,
    roles: ['super_admin', 'manager'],
  },
  {
    title: 'Документация',
    href: '/docs',
    icon: FileText,
    roles: ['super_admin', 'manager', 'intern'],
  },
  {
    title: 'Управление',
    href: '/admin',
    icon: Users,
    roles: ['super_admin'],
  },
  {
    title: 'Справочники',
    href: '/reference-data',
    icon: Database,
    roles: ['super_admin'],
  },
  {
    title: 'Аудит',
    href: '/audit',
    icon: Activity,
    roles: ['super_admin'],
  },
];

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const location = useLocation();
  const { profile, userRoles, signOut } = useAuth();

  const filteredNavItems = navItems.filter((item) =>
    userRoles.length > 0 ? item.roles.some(role => userRoles.includes(role)) : false
  );

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="w-64 h-full lg:min-h-screen bg-primary flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-primary-hover">
        <Link to="/" className="flex items-center gap-3" onClick={handleNavClick}>
          <img src={navigatorLogo} alt="Navigator House" className="h-12 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">Navigator House</h1>
            <p className="text-xs text-primary-foreground/70">Управление недвижимостью</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-primary-hover space-y-2">
        <Link
          to="/profile"
          onClick={handleNavClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Профиль</span>
        </Link>
        
        <Button
          onClick={() => {
            handleNavClick();
            signOut();
          }}
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Выход</span>
        </Button>

        {profile && (
          <div className="mt-4 px-4 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium text-sidebar-foreground">{profile.full_name}</p>
            <p className="text-xs text-sidebar-foreground/70">{profile.email}</p>
            {userRoles.length > 0 && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-sidebar-primary text-sidebar-primary-foreground">
                {userRoles.includes('super_admin') ? 'Супер-админ' : userRoles.includes('manager') ? 'Менеджер' : 'Стажер'}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
