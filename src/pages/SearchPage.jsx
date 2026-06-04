import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Grid, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Initialize from URL or defaults
  const [searchType, setSearchType] = useState(searchParams.get('searchType') || 'sale');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [queryText, setQueryText] = useState(searchParams.get('q') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [bedrooms, setBedrooms] = useState('');
  const [suites, setSuites] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProperties();
  }, [searchParams, sortBy]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*, broker:brokers(*)')
        .eq('status', 'active');

      // Filter by Business Type (Strict)
      if (searchType) query.eq('business_type', searchType);

      if (propertyType) query.eq('type', propertyType);
      if (neighborhood) query.ilike('neighborhood', `%${neighborhood}%`);

      const trimmedQ = (queryText || '').trim();
      if (trimmedQ) {
        const normalized = trimmedQ.toUpperCase();
        const isExactCode = /^IMV-\d{6}$/.test(normalized);
        if (isExactCode) {
          query = query.eq('code', normalized);
        } else {
          const escaped = trimmedQ.replace(/,/g, ' ');
          query = query.or(`title.ilike.%${escaped}%,code.ilike.%${escaped}%`);
        }
      }
      
      // Price logic depends on business type
      if (searchType === 'sale') {
        if (minPrice) query.gte('price', parseFloat(minPrice));
        if (maxPrice) query.lte('price', parseFloat(maxPrice));
      } else if (searchType === 'rent') {
        if (minPrice) query.gte('rental_price', parseFloat(minPrice));
        if (maxPrice) query.lte('rental_price', parseFloat(maxPrice));
      }

      if (bedrooms) query.gte('bedrooms', parseInt(bedrooms));
      if (suites) query.gte('suites', parseInt(suites));
      if (parkingSpaces) query.gte('parking_spaces', parseInt(parkingSpaces));

      switch (sortBy) {
        case 'price_asc':
          query.order(searchType === 'sale' ? 'price' : 'rental_price', { ascending: true });
          break;
        case 'price_desc':
          query.order(searchType === 'sale' ? 'price' : 'rental_price', { ascending: false });
          break;
        default:
          query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('[SearchPage] Error fetching properties:', error);
      if (import.meta.env.DEV) {
        console.error('[SearchPage] Details:', error?.message || error?.details || error?.hint || error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (searchType) params.append('searchType', searchType);
    if (propertyType) params.append('type', propertyType);
    if (neighborhood) params.append('neighborhood', neighborhood);
    if ((queryText || '').trim()) params.append('q', queryText.trim());
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchType('sale');
    setPropertyType('');
    setNeighborhood('');
    setQueryText('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setSuites('');
    setParkingSpaces('');
    setSearchParams({});
  };

  return (
    <>
      <Helmet>
        <title>Buscar Imóveis em São Paulo | Imóveis SP</title>
      </Helmet>

      <div className="min-h-screen bg-[#f5f7fa] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1a3a52] mb-2">Buscar Imóveis</h1>
              <p className="text-gray-600">{properties.length} imóveis encontrados</p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filtros</Button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="newest">Mais Recentes</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
              </select>
              <div className="flex gap-2">
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}><Grid className="w-4 h-4" /></Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-[#1a3a52]">Filtros Avançados</h2><Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></Button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buscar (Código ou Lançamento)</label>
                  <input type="text" value={queryText} onChange={(e) => setQueryText(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: IMV-XXXX ou nome" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Negócio</label>
                  <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="sale">Venda</option>
                    <option value="rent">Aluguel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Imóvel</label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Todos</option>
                    <option value="studio">Studio</option>
                    <option value="apartment">Apartamento</option>
                    <option value="house">Casa</option>
                    <option value="commercial">Comercial</option>
                    <option value="land">Terreno</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label><input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              </div>
              <div className="flex gap-4 mt-6"><Button onClick={handleApplyFilters} className="flex-1 bg-[#0d5a7a]">Aplicar Filtros</Button><Button onClick={clearFilters} variant="outline" className="flex-1">Limpar Filtros</Button></div>
            </motion.div>
          )}

          <div className="h-full">
            {loading ? (
                <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d5a7a]"></div></div>
              ) : properties.length > 0 ? (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  {properties.map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}
                </div>
              ) : (
                <div className="text-center py-20"><p className="text-xl text-gray-600 mb-4">Nenhum imóvel encontrado.</p><Button onClick={clearFilters} variant="outline">Limpar Filtros</Button></div>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPage;
