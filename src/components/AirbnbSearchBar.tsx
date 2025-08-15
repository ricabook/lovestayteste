import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AirbnbSearchBarProps {
  onSearch: (filters: {
    destination: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
  }) => void;
  className?: string;
}

export default function AirbnbSearchBar({ onSearch, className }: AirbnbSearchBarProps) {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const isMobile = useIsMobile();

  const handleSearch = () => {
    onSearch({
      destination,
      checkIn,
      checkOut,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto px-4 sm:px-0 relative z-20", className)}>
      <div className={cn(
        "bg-white shadow-lg border border-gray-200 overflow-hidden",
        isMobile ? "rounded-2xl" : "rounded-full"
      )}>
        <div className={cn(
          "divide-gray-200",
          isMobile 
            ? "flex flex-col divide-y" 
            : "flex flex-row divide-x"
        )}>
{/* Onde */}
<div className={cn(
  "flex-1",
  isMobile ? "p-4" : "p-3 md:p-4"
)}>
  <div className="space-y-1">
    <label className={cn(
      "font-semibold text-gray-900 uppercase tracking-wide",
      isMobile ? "text-sm" : "text-xs"
    )}>
      Onde
    </label>
    <div className={cn(
      "flex items-center space-x-2", // Usando flex com space-x-2 para separar ícone e input
      isMobile ? "min-h-[40px]" : "min-h-[20px]"
    )}>
      <MapPin className={cn(
        "text-gray-400 flex-shrink-0",
        isMobile ? "h-5 w-5" : "h-4 w-4"
      )} />
      <Input
        placeholder="Buscar destinos"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        onKeyPress={handleKeyPress}
        className={cn(
          "border-none bg-transparent placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 w-full",
          isMobile 
            ? "p-0 text-base h-8" 
            : "p-0 text-sm h-5"
        )}
      />
    </div>
  </div>
</div>

          {/* Check-in */}
          <div className={cn(
            "flex-1",
            isMobile ? "p-4" : "p-3 md:p-4"
          )}>
            <div className="space-y-1">
              <label className={cn(
                "font-semibold text-gray-900 uppercase tracking-wide",
                isMobile ? "text-sm" : "text-xs"
              )}>
                Check-in
              </label>
              <div className={cn(
                "flex items-center",
                isMobile ? "min-h-[40px]" : "min-h-[20px]"
              )}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left font-normal p-0 hover:bg-transparent",
                        !checkIn && "text-gray-400",
                        isMobile ? "h-8" : "h-5"
                      )}
                    >
                      <CalendarIcon className={cn(
                        "mr-2 flex-shrink-0",
                        isMobile ? "h-5 w-5" : "h-4 w-4"
                      )} />
                      {checkIn ? (
                        <span className={cn(
                          isMobile ? "text-base" : "text-sm"
                        )}>
                          {format(checkIn, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      ) : (
                        <span className={cn(
                          isMobile ? "text-base" : "text-sm"
                        )}>
                          Insira as datas
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0" 
                    align={isMobile ? "center" : "start"}
                    side={isMobile ? "bottom" : "bottom"}
                  >
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className={cn(
                        "pointer-events-auto",
                        isMobile ? "p-4" : "p-3"
                      )}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Check-out */}
          <div className={cn(
            "flex-1",
            isMobile ? "p-4" : "p-3 md:p-4"
          )}>
            <div className="space-y-1">
              <label className={cn(
                "font-semibold text-gray-900 uppercase tracking-wide",
                isMobile ? "text-sm" : "text-xs"
              )}>
                Check-out
              </label>
              <div className={cn(
                "flex items-center",
                isMobile ? "min-h-[40px]" : "min-h-[20px]"
              )}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left font-normal p-0 hover:bg-transparent",
                        !checkOut && "text-gray-400",
                        isMobile ? "h-8" : "h-5"
                      )}
                    >
                      <CalendarIcon className={cn(
                        "mr-2 flex-shrink-0",
                        isMobile ? "h-5 w-5" : "h-4 w-4"
                      )} />
                      {checkOut ? (
                        <span className={cn(
                          isMobile ? "text-base" : "text-sm"
                        )}>
                          {format(checkOut, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      ) : (
                        <span className={cn(
                          isMobile ? "text-base" : "text-sm"
                        )}>
                          Insira as datas
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0" 
                    align={isMobile ? "center" : "start"}
                    side={isMobile ? "bottom" : "bottom"}
                  >
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      initialFocus
                      disabled={(date) => date < new Date() || (checkIn && date <= checkIn)}
                      className={cn(
                        "pointer-events-auto",
                        isMobile ? "p-4" : "p-3"
                      )}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Botão de Pesquisa */}
          <div className={cn(
            "flex items-center justify-center",
            isMobile ? "p-4" : "p-2 md:p-3"
          )}>
            <Button
              onClick={handleSearch}
              className={cn(
                "rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-[#E3494A] hover:bg-[#E3494A]/90 text-white",
                isMobile 
                  ? "w-full h-12 px-6" 
                  : "h-10 w-10 md:h-12 md:w-12"
              )}
            >
              <Search className={cn(
                "text-white",
                isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 md:h-5 md:w-5"
              )} />
              {isMobile && <span className="font-semibold">Pesquisar</span>}
              <span className="sr-only">Pesquisar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}