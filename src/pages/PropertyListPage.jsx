import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Filter, LayoutGrid, LayoutList, Check, Building2, Key, Loader2, Map as MapIcon, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { cn, normalizeString } from '@/lib/utils';
import { formatPrice } from '@/utils/seoHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { trackWhatsAppClick } from '@/utils/analyticsEvents';
import Seo from '@/components/Seo';

// Lazy load heavy components
const PropertyCard = lazy(() => import('@/components/PropertyCard'));
const PropertyMapModal = lazy(() => import('@/components/PropertyMapModal'));
const Slider = lazy(() => import('@/components/ui/slider').then(mod => ({ default: mod.Slider })));

// Debounce utility to avoid lodash dep
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const toSupabasePublicImageUrl = (raw) => {
  if (typeof raw !== 'string') return '';
  const url = raw
    .trim()
    .replace(/^["']+/, '')
    .replace(/["']+$/, '')
    .replace(/,+$/, '')
    .trim();
  if (!url) return '';

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) {
    return url.includes(' ') ? url.replace(/ /g, '%20') : url;
  }

  // Convert relative/path formats to the public bucket URL using the configured Supabase client
  let path = url.replace(/^\/+/, '');
  path = path.replace(/^property-images\//, '');
  path = path.replace(/^storage\/v1\/object\/public\/property-images\//, '');
  path = path.replace(/^storage\/v1\/object\/public\//, '');
  path = path.replace(/^property-images\//, '');

  const encodedPath = path
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');

  const publicUrl = supabase?.storage?.from?.('property-images')?.getPublicUrl?.(encodedPath)?.data?.publicUrl;
  return publicUrl || url;
};

const normalizeUrlArray = (value) => {
  if (!value) return [];

  let arr = value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      arr = parsed;
    } catch {
      arr = trimmed
        .split(/\s*[|,]\s*/)
        .map((u) => u.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(arr)) return [];

  return arr
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return toSupabasePublicImageUrl(item);
      if (typeof item === 'object') return toSupabasePublicImageUrl(item.url || item.publicUrl || item.public_url || '');
      return null;
    })
    .filter(Boolean);
};

const PropertyListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [businessTypeFilter, setBusinessTypeFilter] = useState(searchParams.get('businessType') || 'all');
  const [queryText, setQueryText] = useState(searchParams.get('q') || '');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  // Batch Rendering State for Performance
  const [visibleCount, setVisibleCount] = useState(12);

  // Filters
  const [filters, setFilters] = useState({
    priceRange: [0, Infinity],
    type: searchParams.get('type') || 'all',
    location: searchParams.get('location') || 'all',
    status: 'all'
  });

  useEffect(() => {
    const parsedMin = Number(searchParams.get('minPrice'));
    const parsedMax = Number(searchParams.get('maxPrice'));

    const nextMin = Number.isFinite(parsedMin) && parsedMin >= 0 ? parsedMin : null;
    const nextMax = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : null;

    if (nextMin === null && nextMax === null) return;

    setFilters((prev) => ({
      ...prev,
      priceRange: [nextMin ?? prev.priceRange[0] ?? 0, nextMax ?? prev.priceRange[1] ?? Infinity]
    }));
  }, []);

  // Debounced Filter Values
  const debouncedPrice = useDebounce(filters.priceRange, 300);

  useEffect(() => {
    const savedMode = localStorage.getItem('propertyViewMode');
    if (savedMode) setViewMode(savedMode);
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('propertyViewMode', mode);
  };

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (businessTypeFilter !== 'all') params.set('businessType', businessTypeFilter);
    else params.delete('businessType');
    
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.location !== 'all') params.set('location', filters.location);

    const trimmedQ = (queryText || '').trim();
    if (trimmedQ) params.set('q', trimmedQ);
    else params.delete('q');
    
    setSearchParams(params, { replace: true });
    
    // Reset fetch/visible count when main filters change
    setVisibleCount(12);
    fetchProperties();
  }, [businessTypeFilter, filters.type, filters.location, queryText]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let query = supabase.from('properties')
        .select('*, broker:brokers(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (businessTypeFilter !== 'all') {
        query = query.eq('business_type', businessTypeFilter);
      }

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

      const { data, error } = await query;
      if (error) throw error;
      const normalized = (data || []).map((p) => ({
        ...p,
        images: normalizeUrlArray(p.images),
        plans_urls: normalizeUrlArray(p.plans_urls),
        floor_plans: normalizeUrlArray(p.floor_plans)
      }));

      setProperties(normalized);
    } catch (error) {
	  console.error('[PropertyListPage] Error fetching properties:', error);
	  const devDetails = import.meta.env.DEV
	    ? (error?.message || error?.details || error?.hint || JSON.stringify(error))
	    : null;
	  toast({
	    title: 'Erro ao carregar imóveis',
	    description: devDetails ? `Detalhes: ${devDetails}` : 'Tente novamente.',
	    variant: 'destructive'
	  });
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredProperties = properties.filter(property => {
    const price = property.business_type === 'rent' ? property.rental_price : property.price;
    const safePrice = price || 0;

    const propNeighborhood = normalizeString(property.neighborhood);
    const filterLoc = normalizeString(filters.location);

    const matchesType = filters.type === 'all' || property.type === filters.type;
    // Use debounced price for filtering to avoid UI lag while sliding
    const matchesPrice = safePrice >= debouncedPrice[0] && safePrice <= debouncedPrice[1];
    const matchesStatus = filters.status === 'all' || property.property_status === filters.status;
    const matchesLocation = filters.location === 'all' || propNeighborhood.includes(filterLoc);

    const q = normalizeString(queryText);
    const title = normalizeString(property.title);
    const code = normalizeString(property.code);
    const matchesQuery = !q || title.includes(q) || code.includes(q);

    return matchesType && matchesPrice && matchesStatus && matchesLocation && matchesQuery;
  });

  const uniqueLocations = [...new Set(properties.map(p => p.neighborhood).filter(Boolean))];
  const visibleProperties = filteredProperties.slice(0, visibleCount);

  const handleLoadMore = () => setVisibleCount(prev => prev + 12);

  const handleCardClickCapture = (e, property) => {
    if (e.target.closest('button') && e.target.closest('button').textContent.toLowerCase().includes('whatsapp')) {
      trackWhatsAppClick({
        page_path: window.location.pathname,
        property_slug: property.slug,
        deal_type: property.business_type,
        neighborhood: property.neighborhood,
        property_id: property.id
      });
    }
  };

  return (
    <>
      <Seo
        title="Imóveis à Venda e Locação em São Paulo | Imóveis SP"
        description="Encontre imóveis para venda e locação em São Paulo. Apartamentos, casas, studios e imóveis comerciais nos melhores bairros."
        canonical={`/imoveis${typeof window !== 'undefined' ? window.location.search : ''}`}
        type="website"
        keywords={[
          'imóveis à venda são paulo',
          'imóveis para alugar são paulo',
          'apartamentos são paulo',
          'casas são paulo',
          'imóveis por bairro sp'
        ]}
      />
      
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl text-foreground mb-4">Properties</h1>
              <div className="flex flex-wrap gap-2">
                 {['all', 'sale', 'rent'].map(type => (
                   <Button 
                     key={type}
                     onClick={() => setBusinessTypeFilter(type)} 
                     variant="outline" 
                     className={cn(
                       'rounded-full gap-2 transition-all', 
                       businessTypeFilter === type 
                         ? 'bg-primary text-primary-foreground border-primary'
                         : 'bg-white hover:bg-secondary'
                     )}
                   >
                     {type === 'all' && 'Todos'}
                     {type === 'sale' && <><Building2 className="w-4 h-4"/> Venda</>}
                     {type === 'rent' && <><Key className="w-4 h-4"/> Locação</>}
                     {businessTypeFilter === type && type !== 'all' && <Check className="w-3 h-3" />}
                   </Button>
                 ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="bg-white rounded-lg shadow-sm p-1 border flex">
                <button onClick={() => handleViewModeChange('list')} className={cn("p-2 rounded transition-colors", viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary')}><LayoutList className="w-5 h-5" /></button>
                <button onClick={() => handleViewModeChange('grid')} className={cn("p-2 rounded transition-colors", viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary')}><LayoutGrid className="w-5 h-5" /></button>
              </div>
              <Button onClick={() => setIsMapModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <MapIcon className="w-4 h-4" /> Mapa
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="input-field w-full pl-9"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Código ou nome do lançamento"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select className="input-field w-full" value={filters.type} onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="all">Todos</option>
                  <option value="studio">Studio</option>
                  <option value="house">Casa</option>
                  <option value="apartment">Apartamento</option>
                  <option value="commercial">Comercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                <select className="input-field w-full" value={filters.location} onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}>
                  <option value="all">Todos</option>
                  {uniqueLocations.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select className="input-field w-full" value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="all">Todos</option>
                  <option value="ready">Pronto</option>
                  <option value="construction">Em Obras</option>
                  <option value="launch">Lançamento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                   Max Preço: {filters.priceRange[1] < 20000000 ? formatPrice(filters.priceRange[1]) : 'Sem limite'}
                </label>
                <Suspense fallback={<div className="h-2 bg-gray-200 rounded animate-pulse" />}>
                   <Slider 
                     defaultValue={[filters.priceRange[1]]} 
                     max={20000000} 
                     step={100000} 
                     onValueChange={val => setFilters(prev => ({ ...prev, priceRange: [0, val[0]] }))} 
                     className="py-2" 
                   />
                </Suspense>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-400" /><p className="mt-2 text-gray-500">Buscando imóveis...</p></div>
          ) : filteredProperties.length > 0 ? (
            <>
               <div className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                 <Suspense fallback={<Skeleton className="h-64" />}>
                   {visibleProperties.map((property, index) => (
                     <div key={property.id} onClickCapture={(e) => handleCardClickCapture(e, property)}>
                       <PropertyCard property={property} index={index} layout={viewMode} />
                     </div>
                   ))}
                 </Suspense>
               </div>
               
               {visibleCount < filteredProperties.length && (
                 <div className="mt-10 text-center">
                    <Button onClick={handleLoadMore} variant="outline" className="min-w-[200px]">
                       Carregar Mais Imóveis
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                       Exibindo {visibleProperties.length} de {filteredProperties.length}
                    </p>
                 </div>
               )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-700">Nenhum imóvel encontrado</h3>
              <Button variant="link" onClick={() => setFilters({ priceRange: [0, Infinity], type: 'all', location: 'all', status: 'all' })} className="mt-2 text-blue-600">Limpar Filtros</Button>
            </div>
          )}

          <Suspense fallback={null}>
            {isMapModalOpen && (
              <PropertyMapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} properties={filteredProperties} />
            )}
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default PropertyListPage;
