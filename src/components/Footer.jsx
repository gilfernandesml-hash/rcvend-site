import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Instagram, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <footer className="bg-[#0b2a4a] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo-roda-pe.png" alt="Radar" className="h-14 w-auto" />
              <div className="leading-tight">
                <p className="font-sans text-xl text-white">Radar</p>
                <p className="text-xs text-white/70">RALF Negócios Imobiliário</p>
              </div>
            </div>
            <p className="text-sm text-white/70 mt-4 leading-relaxed">
              Sua imobiliária de confiança em São Paulo. Atendimento consultivo para compra, venda e locação nos melhores bairros.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="font-bold">Links Rápidos</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link className="hover:text-white" to="/">Início</Link></li>
              <li><Link className="hover:text-white" to="/imoveis">Imóveis</Link></li>
              <li><Link className="hover:text-white" to="/blog">Blog</Link></li>
              <li><Link className="hover:text-white" to="/contact">Contato</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold">Contato</p>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-white/60" />
                <span>Av Dr Chucry Zaidan, 111<br />São Paulo – SP</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/60" />
                <a className="hover:text-white" href="tel:5511970259728">(11) 97025-9728</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/60" />
                <a className="hover:text-white" href="mailto:radar.consultoriaimoveis@gmail.com">radar.consultoriaimoveis@gmail.com</a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-bold">Newsletter</p>
            <p className="text-sm text-white/70 mt-4">
              Receba as melhores ofertas, lançamentos e notícias do mercado.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Seu e-mail"
                className="w-full rounded-md bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white/25 focus:border-white/25"
              />
              <Button type="submit" className="bg-white hover:bg-white/90 text-[#0b2a4a]">
                Inscrever
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <p> {new Date().getFullYear()} Radar — Todos os direitos reservados.</p>
          <p>Desenvolvido para o mercado imobiliário em São Paulo.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
