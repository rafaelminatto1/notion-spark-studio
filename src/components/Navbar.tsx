import React, { useState } from 'react';
import { 
  Home, 
  FileText, 
  Settings, 
  User, 
  BarChart3, 
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { usePerformance } from '../hooks/usePerformance';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNavigate, 
  currentSection = 'dashboard' 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { alerts, isMonitoring } = usePerformance();
  
  // Contar alertas críticos (últimas 24h)
  const recentCriticalAlerts = alerts.filter(alert => 
    alert.type === 'error' && 
    Date.now() - alert.timestamp < 24 * 60 * 60 * 1000
  ).length;

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/'
    },
    {
      id: 'tasks',
      label: 'Tarefas',
      icon: FileText,
      path: '/tasks'
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: BarChart3,
      path: '/performance',
      badge: recentCriticalAlerts > 0 ? recentCriticalAlerts : undefined,
      badgeVariant: 'destructive' as const
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      path: '/settings'
    }
  ];

  const handleNavigation = (sectionId: string) => {
    onNavigate?.(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo e Navegação Principal */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Notion Spark Studio
              </h1>
            </div>
            
            {/* Navegação Desktop */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`
                      inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${isActive 
                        ? 'border-blue-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <Badge 
                        variant={item.badgeVariant} 
                        className="ml-2 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ações da Direita */}
          <div className="flex items-center space-x-4">
            {/* Indicador de Performance */}
            {isMonitoring && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Monitorando</span>
              </div>
            )}

            {/* Busca */}
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>

            {/* Notificações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  {recentCriticalAlerts > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 text-xs min-w-[1.25rem] h-5"
                    >
                      {recentCriticalAlerts}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3 border-b">
                  <h3 className="font-semibold">Notificações</h3>
                </div>
                {recentCriticalAlerts > 0 ? (
                  <>
                    <DropdownMenuItem 
                      onClick={() => handleNavigation('performance')}
                      className="p-3 cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <BarChart3 className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">
                            Alertas de Performance
                          </p>
                          <p className="text-xs text-gray-500">
                            {recentCriticalAlerts} problema(s) crítico(s) detectado(s)
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem className="p-3 text-center text-gray-500">
                  {recentCriticalAlerts === 0 ? 'Nenhuma notificação' : 'Ver todas'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-3 border-b">
                  <p className="font-medium text-sm">
                    {user?.user_metadata?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuItem onClick={() => handleNavigation('settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('performance')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Performance
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu Mobile */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`
                      w-full flex items-center px-3 py-2 text-base font-medium
                      ${isActive 
                        ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                    {item.badge && (
                      <Badge 
                        variant={item.badgeVariant} 
                        className="ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Status de Monitoramento Mobile */}
            {isMonitoring && (
              <div className="px-3 py-2 border-t border-gray-200">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Performance sendo monitorada</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}; 