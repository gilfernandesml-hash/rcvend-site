import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Building2, Award, Users, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import ImageOptimizer from '@/components/ImageOptimizer';
import Seo from '@/components/Seo';
import WhyChooseSection from '@/components/home/WhyChooseSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import LatestNewsSection from '@/components/home/LatestNewsSection';
import GoogleReviewsSection from '@/components/home/GoogleReviewsSection';
import { logBundleInfo } from '@/utils/performanceReporter';
import { trackWhatsAppClick } from '@/utils/analyticsEvents';

// Lazy load components below the fold
const PropertyCard = lazy(() => import('@/components/PropertyCard'));

const DEFAULT_CONTENT = {
  hero_title: 'Imóveis exclusivos\nna Zona Sul de São Paulo',
  hero_subtitle: 'Curadoria de médio e alto padrão com atendimento consultivo do início à entrega das chaves.',
  hero_image_url: '/hero-rcvend.jpg'
};

const HomePage = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loadingContent, setLoadingContent] = useState(true);
  
  // Search States
  const [searchType, setSearchType] = useState('sale');
  const [propertyType, setPropertyType] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [queryText, setQueryText] = useState('');
	const [minPrice, setMinPrice] = useState('');
	const [maxPrice, setMaxPrice] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => { 
    logBundleInfo('HomePage');
    fetchPageSettings();
    setTimeout(fetchProperties, 100); 
  }, []);

  const fetchPageSettings = async () => {
    try {
      const { data } = await supabase.from('home_page_settings').select('*').limit(1).maybeSingle();
			if (data) {
				setContent((prev) => ({
					...prev,
					...data,
					hero_image_url: DEFAULT_CONTENT.hero_image_url,
				}));
			}
    } catch (e) { console.error(e); } finally { setLoadingContent(false); }
  };

  const fetchProperties = async () => {
    try {
      const { data } = await supabase.from('properties').select('*').eq('featured', true).eq('status', 'active').limit(6);
      setFeaturedProperties(data || []);
    } catch (e) { console.error(e); } finally { setLoadingProperties(false); }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchType) params.append('businessType', searchType);
    if (propertyType) params.append('type', propertyType);
    if (neighborhood) params.append('location', neighborhood);
    if (queryText) params.append('q', queryText);
		if (minPrice) params.append('minPrice', minPrice);
		if (maxPrice) params.append('maxPrice', maxPrice);
    navigate(`/imoveis?${params.toString()}`);
  };

  const whatsappPhone = '5511970259728';
  const whatsappText = encodeURIComponent('Olá! Vim pelo site. Quero comprar um imóvel na Zona Sul de São Paulo (médio/alto padrão) e gostaria de sugestões.');
  const whatsappHref = `https://wa.me/${whatsappPhone}?text=${whatsappText}`;

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    name: 'Radar',
    url: 'https://rcvend.com.br/',
    email: 'radar.consultoriaimoveis@gmail.com',
    telephone: '+55 11 97025-9728',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av Dr Chucry Zaidan, 111',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR'
    },
    areaServed: {
      '@type': 'City',
      name: 'São Paulo'
    },
    knowsAbout: [
      'Imóveis na Zona Sul de São Paulo',
      'Santo Amaro',
      'Adolfo Pinheiro',
      'Brooklin',
      'Campo Belo',
      'Chácara Santo Antônio',
      'Lançamentos imobiliários',
      'Investimento imobiliário'
    ]
  };

  return (
    <>
      <Seo
        title={`${content.hero_title} | Radar`}
        description={content.hero_subtitle}
        canonical="/"
        type="website"
        keywords={[
          'imóveis em são paulo',
          'apartamento à venda em são paulo',
          'casa à venda em são paulo',
          'imóveis a venda zona sul sp',
          'imóveis a venda santo amaro',
          'imóveis a venda adolfo pinheiro',
          'imóveisa venda brooklin',
          'imóveis a venda campo belo',
          'imóveis a venda chácara santo antônio',
          'imóveis a venda zona oeste sp',
          'imóveis a venda vila mariana',
          'imóveis a venda pinheiros',
          'imóveis a venda moema',
          'lançamentos imobiliários zona sul sp',
          'investimento imobiliário zona sul sp'
        ]}
        schema={[businessSchema]}
      />

      <main className="min-h-screen">
        {/* HERO - CRITICAL LCP */}
        <section className="relative min-h-[78vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
             <ImageOptimizer 
                src={content.hero_image_url} 
                alt="São Paulo Skyline" 
                className="w-full h-full"
                priority={true}
                width={1920}
                height={1080}
                sizes="100vw"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55" />
          </div>

          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 pt-24 pb-24">
			<div className="text-center">
				<h1 className="text-white drop-shadow-lg text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-[-0.02em]">
					{loadingContent ? (
						<Skeleton className="h-14 w-3/4 mx-auto bg-white/20" />
					) : (
						(content.hero_title || '').split('\n').map((line, idx) => (
							<span key={idx} className="block">
								{line}
							</span>
						))
					)}
				</h1>
				<p className="font-sans mt-5 text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
					{loadingContent ? <Skeleton className="h-8 w-2/3 mx-auto bg-white/20" /> : content.hero_subtitle}
				</p>
				<div className="mt-8 flex flex-wrap gap-3 justify-center mb-10">
					<Button onClick={handleSearch} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-7 h-12 shadow-md shadow-black/10 transition-transform active:scale-[0.99]">
						Buscar imóveis
					</Button>
					<Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-7 h-12 shadow-md shadow-black/10 transition-transform active:scale-[0.99]">
						<a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick({ page_path: window.location.pathname, source: 'home_hero_whatsapp' })}>
							<MessageCircle className="mr-2 w-4 h-4" /> WhatsApp
						</a>
					</Button>
				</div>
			</div>
		</div>
        </section>

		{/* SEARCH BAR */}
		<section className="-mt-10 relative z-30">
			<div className="max-w-7xl mx-auto px-4">
				<div className="bg-white/98 backdrop-blur rounded-xl shadow-lg shadow-black/5 border border-border p-4">
					<div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
						<select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="w-full h-12 bg-white border border-input rounded-xl px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all">
							<option value="">Tipo de imóvel</option>
							<option value="studio">Studio</option>
							<option value="apartment">Apartamento</option>
							<option value="house">Casa</option>
							<option value="commercial">Comercial</option>
						</select>
						<input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Localização" className="w-full h-12 bg-white border border-input rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all" />
						<select value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full h-12 bg-white border border-input rounded-xl px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all">
							<option value="">Preço mín.</option>
							<option value="300000">R$ 300 mil</option>
							<option value="500000">R$ 500 mil</option>
							<option value="800000">R$ 800 mil</option>
							<option value="1000000">R$ 1 mi</option>
							<option value="1500000">R$ 1,5 mi</option>
						</select>
						<select value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full h-12 bg-white border border-input rounded-xl px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all">
							<option value="">Preço máx.</option>
							<option value="700000">R$ 700 mil</option>
							<option value="1000000">R$ 1 mi</option>
							<option value="1500000">R$ 1,5 mi</option>
							<option value="2000000">R$ 2 mi</option>
							<option value="3000000">R$ 3 mi</option>
							<option value="5000000">R$ 5 mi</option>
						</select>
						<Button onClick={handleSearch} className="w-full h-12 md:col-span-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 shadow-md shadow-black/5">
							Buscar imóveis
						</Button>
					</div>
				</div>
			</div>
		</section>

		{/* FEATURED PROPERTIES - Lazy Loaded */}
		<section className="py-20 bg-background">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
					<div>
						<h2 className="text-3xl md:text-4xl text-foreground">Imóveis em destaque</h2>
						<p className="text-muted-foreground mt-2">Explore imóveis selecionados</p>
					</div>
					<Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md">
						<a href={whatsappHref} target="_blank" rel="noopener noreferrer">
							<MessageCircle className="mr-2 w-4 h-4" />
							Pedir sugestões
						</a>
					</Button>
				</div>

				{loadingProperties ? (
					<div className="flex flex-col gap-6">
						{[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl w-full" />)}
					</div>
				) : (
					<Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>}>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8" onClickCapture={(e) => {
							if (e.target.closest('button') && e.target.closest('button').textContent.toLowerCase().includes('whatsapp')) {
								trackWhatsAppClick({ page_path: window.location.pathname, deal_type: 'venda', source: 'featured_card' });
							}
						}}>
							{featuredProperties.map((p, i) => (
								<PropertyCard key={p.id} property={p} index={i} layout="grid" />
							))}
						</div>
						<div className="text-center mt-10">
							<Link to="/imoveis">
								<Button variant="outline" size="lg" className="border-border text-foreground hover:bg-secondary">Ver todos os imóveis</Button>
							</Link>
						</div>
					</Suspense>
				)}
			</div>
		</section>

        {/* STATS - Static Content */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <StatItem icon={Award} value="15+ anos" label="Experiência de Mercado" />
            <StatItem icon={Building2} value="100+" label="Imóveis Vendidos" />
            <StatItem icon={Users} value="500+" label="Clientes Satisfeitos" />
          </div>
        </section>

        <WhyChooseSection />
        <HowItWorksSection />
        <GoogleReviewsSection />
        <TestimonialsSection />
        <LatestNewsSection />
      </main>
    </>
  );
};

const StatItem = ({ icon: Icon, value, label }) => (
    <div className="p-6 rounded-xl hover:bg-gray-50 transition-colors">
		<Icon className="mx-auto text-primary w-12 h-12 mb-4" />
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
        <p className="text-gray-600 font-medium">{label}</p>
    </div>
);

export default HomePage;
