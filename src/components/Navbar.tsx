import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { User, Home, Settings, Menu, X, Building, Calendar, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { role, isAdmin } = useUserRole();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="flex items-center space-x-2 touch-target">
            <img 
              src="/lovable-uploads/ea12e02a-fac8-443a-ac7a-e66db3a75ba0.png" 
              alt="LoveStay"
              className="h-6 sm:h-8 w-auto"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {user ? (
              <>
                <Link to="/">
                  <Button variant="ghost" size="sm" className="touch-target">
                    <Home className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">Início</span>
                  </Button>
                </Link>

                <Link to="/account">
                  <Button variant="ghost" size="sm" className="touch-target">
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">Conta</span>
                  </Button>
                </Link>
                
                <Link to="/bookings">
                  <Button variant="ghost" size="sm" className="touch-target">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">Reservas</span>
                  </Button>
                </Link>
                
                <Link to="/mensagens">
                  <Button variant="ghost" size="sm" className="touch-target">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">Mensagens</span>
                  </Button>
                </Link>


                {role === 'proprietario' && (
                  <Link to="/propriedades">
                    <Button variant="ghost" size="sm" className="touch-target">
                      <Building className="w-4 h-4 mr-2" />
                      <span className="hidden lg:inline">Quartos</span>
                    </Button>
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="touch-target">
                      <Settings className="w-4 h-4 mr-2" />
                      <span className="hidden lg:inline">Dashboard</span>
                    </Button>
                  </Link>
                )}

                <Button variant="ghost" size="sm" onClick={handleSignOut} className="touch-target">
                  <span className="hidden lg:inline">Sair</span>
                  <span className="lg:hidden">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="touch-target">
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="touch-target"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <div className="px-4 py-3 space-y-1 safe-bottom">
              {user ? (
                <>
                  <Link to="/" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-12 text-base touch-target">
                      <Home className="w-5 h-5 mr-3" />
                      Início
                    </Button>
                  </Link>

                  <Link to="/account" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-12 text-base touch-target">
                      <User className="w-5 h-5 mr-3" />
                      Conta
                    </Button>
                  </Link>
                  
                  <Link to="/bookings" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-12 text-base touch-target">
                      <Calendar className="w-5 h-5 mr-3" />
                      Reservas
                    </Button>
                  </Link>
                  
                  <Link to="/mensagens" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="w-full justify-start h-12 text-base touch-target">
                      <MessageSquare className="w-5 h-5 mr-3" />
                      Mensagens
                    </Button>
                  </Link>


                  {role === 'proprietario' && (
                    <Link to="/propriedades" onClick={closeMenu}>
                      <Button variant="ghost" size="sm" className="w-full justify-start h-12 text-base touch-target">
                        <Building className="w-5 h-5 mr-3" />
                        Quartos
                      </Button>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link to="/admin" onClick={closeMenu}>
                      <Button variant="ghost" size="sm" className="w-full justify-start h-12 text-base touch-target">
                        <Settings className="w-5 h-5 mr-3" />
                        Dashboard
                      </Button>
                    </Link>
                  )}

                  <div className="pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSignOut}
                      className="w-full justify-start h-12 text-base touch-target text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </Button>
                  </div>
                </>
              ) : (
                <Link to="/auth" onClick={closeMenu}>
                  <Button className="w-full justify-start h-12 text-base touch-target">
                    <User className="w-5 h-5 mr-3" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Mensagens */}
  <a href="/mensagens" className="px-3 py-2 rounded-md text-sm font-medium">Mensagens</a>
</nav>
  );
};

export default Navbar;