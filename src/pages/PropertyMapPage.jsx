import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Search, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import MapComponent from '@/components/MapComponent';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PropertyMapPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([-23.550520, -46.633308]); 
  const [mapZoom, setMapZoom] = useState(12);
  const [showSidebar, setShowSidebar] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filters including Business Type
  const [filters, setFilters] = useState({
    priceRange: [0, 5000000],
    type: 'all',
    search: '',
    businessType: 'all' // Added business type filter
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .not('lat', 'is', null) 
        .not('lng', 'is', null);

      if (error) throw error;
      setProperties(data || []);
      
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lng)]);
      }
    } catch (error) {
      console.error('[PropertyMapPage] Error fetching properties:', error);
      const devDetails = import.meta.env.DEV
        ? (error?.message || error?.details || error?.hint || JSON.stringify(error))
        : null;
      toast({
        title: "Erro ao carregar mapa",
        description: devDetails ? `Detalhes: ${devDetails}` : undefined,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (property) => {
    setMapCenter([parseFloat(property.lat), parseFloat(property.lng)]);
    setMapZoom(16);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const filteredProperties = properties.filter(property => {
    const matchesBusinessType = filters.businessType === 'all' || property.business_type === filters.businessType;
    const matchesType = filters.type === 'all' || property.type === filters.type;
    
    const price = property.business_type === 'rent' ? property.rental_price : property.price;
    const safePrice = price || 0;
    
    const matchesPrice = safePrice >= filters.priceRange[0] && safePrice <= filters.priceRange[1];
    const matchesSearch = filters.search === '' || 
      property.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      property.neighborhood.toLowerCase().includes(filters.search.toLowerCase()) ||
      (property.code || '').toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesBusinessType && matchesType && matchesPrice && matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>Mapa de Imóveis | Imóveis SP</title>
      </Helmet>

      <div className="flex h-screen pt-20 overflow-hidden bg-gray-100">
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", md: "400px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="absolute md:relative z-20 h-full w-full md:w-[400px] bg-white shadow-xl flex flex-col border-r border-gray-200"
            >
              <div className="p-4 border-b border-gray-100 bg-white z-10 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-[#1a3a52] text-lg">Explorar no Mapa</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/imoveis')}><List className="w-4 h-4 mr-2" /> Lista</Button>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowSidebar(false)}><ChevronLeft className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Bairro ou título..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>

                {/* Business Type Filter on Map */}
                <div className="flex gap-2">
                    <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 w-1/2" value={filters.businessType} onChange={(e) => setFilters(prev => ({...prev, businessType: e.target.value}))}>
                        <option value="all">Todos (Venda/Locação)</option>
                        <option value="sale">Venda</option>
                        <option value="rent">Locação</option>
                    </select>
                    <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 w-1/2" value={filters.type} onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}>
                        <option value="all">Tipos (Todos)</option>
                        <option value="studio">Studios</option>
                        <option value="apartment">Apartamentos</option>
                        <option value="house">Casas</option>
                        <option value="commercial">Comerciais</option>
                    </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3a52]"></div></div>
                ) : filteredProperties.length > 0 ? (
                  filteredProperties.map(property => (
                    <div key={property.id} onClick={() => handlePropertyClick(property)} className="cursor-pointer transition-transform hover:scale-[1.02]">
                      <PropertyCard property={property} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500"><p>Nenhum imóvel encontrado nesta área.</p></div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative h-full">
          {!showSidebar && (
            <div className="absolute top-4 left-4 z-[400]">
              <Button onClick={() => setShowSidebar(true)} className="bg-white text-[#1a3a52] hover:bg-gray-100 shadow-lg border border-gray-200"><List className="w-4 h-4 mr-2" /> Mostrar Lista</Button>
            </div>
          )}
          <MapComponent properties={filteredProperties} center={mapCenter} zoom={mapZoom} />
        </div>
      </div>
    </>
  );
};

export default PropertyMapPage;
