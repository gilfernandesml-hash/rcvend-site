import React from 'react';
import { Award, Gem, Headphones, ShieldCheck } from 'lucide-react';

const ITEMS = [
  {
    icon: Award,
    title: 'Experiência',
    description: 'Mais de 10 anos de atuação e sucesso no mercado imobiliário.'
  },
  {
    icon: Gem,
    title: 'Qualidade',
    description: 'Imóveis de alto padrão selecionados com extremo rigor e critério.'
  },
  {
    icon: Headphones,
    title: 'Atendimento',
    description: 'Suporte personalizado 24/7 para atender todas as suas necessidades.'
  },
  {
    icon: ShieldCheck,
    title: 'Confiança',
    description: 'Total transparência e segurança jurídica em todas as transações.'
  }
];

const WhyChooseSection = () => {
  return (
    <section className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a3a52]">
            Porque escolher a RCVend
          </h2>
          <p className="text-gray-500 mt-3">
            Nosso compromisso é entregar excelência em cada etapa da sua jornada.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {ITEMS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0d5a7a]/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#0d5a7a]" />
              </div>
              <h3 className="mt-6 font-bold text-[#1a3a52]">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
