import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { generateWhatsAppLink } from '@/lib/whatsapp'; 
import { useLeadTracking } from '@/hooks/useLeadTracking';
import { trackLeadFormOpen, trackLeadFormSubmit } from '@/utils/analyticsEvents';

const ContactPage = () => {
  const location = useLocation();
  const propertyId = location.state?.propertyId;
  const propertyContext = location.state?.property;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    tipo_interesse: 'Compra'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { trackFormSubmit } = useLeadTracking();

  useEffect(() => {
    trackLeadFormOpen({
      property_slug: propertyContext?.slug || null,
      deal_type: propertyContext?.business_type || null
    });
  }, [propertyContext]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: contactError } = await supabase
        .from('contacts')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `[Interesse: ${formData.tipo_interesse}] ${formData.message}`
        }]);

      if (contactError) throw contactError;

      if (propertyId) {
        await supabase
          .from('leads')
          .insert([{
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            property_id: propertyId,
            message: `[Interesse: ${formData.tipo_interesse}] ${formData.message}`,
            status: 'new'
          }]);
      }

      trackFormSubmit(formData, propertyContext);
      
      trackLeadFormSubmit({
        property_slug: propertyContext?.slug || null,
        deal_type: formData.tipo_interesse,
        neighborhood: propertyContext?.neighborhood || null,
        property_id: propertyId || null,
        form_fields: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          tipo_interesse: formData.tipo_interesse
        }
      });

      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
        className: "bg-green-50 border-green-200"
      });

      setFormData({ name: '', email: '', phone: '', message: '', tipo_interesse: 'Compra' });
    } catch (error) {
      console.error("Submission Error:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    window.open(generateWhatsAppLink(), '_blank');
  };

  return (
    <>
      <Helmet>
        <title>Contato | Radar</title>
        <meta name="description" content="Entre em contato conosco para mais informações sobre nossos imóveis" />
      </Helmet>

      <div className="min-h-screen bg-[#f5f7fa] pt-20">
        <div className="bg-gradient-to-r from-[#1a3a52] to-[#0d5a7a] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Entre em Contato</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Estamos aqui para ajudá-lo a encontrar o imóvel perfeito
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-md p-8"
            >
              <h2 className="text-2xl font-bold text-[#1a3a52] mb-6">Envie uma Mensagem</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d5a7a] outline-none"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d5a7a] outline-none"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d5a7a] outline-none"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Interesse</label>
                  <select
                    name="tipo_interesse"
                    value={formData.tipo_interesse}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d5a7a] outline-none bg-white"
                  >
                    <option value="Compra">Compra</option>
                    <option value="Locação">Locação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d5a7a] outline-none resize-none"
                    placeholder="Como podemos ajudá-lo?"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0d5a7a] hover:bg-[#0d5a7a]/90 text-white py-6 text-lg font-semibold transition-all"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-[#1a3a52] mb-6">Informações de Contato</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#0d5a7a]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-[#0d5a7a]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a3a52] mb-1">Telefone</h3>
                      <p className="text-gray-600">(11) 97025-9728</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#0d5a7a]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-[#0d5a7a]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a3a52] mb-1">Email</h3>
                      <p className="text-gray-600">radar.consultoriaimoveis@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#0d5a7a]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-[#0d5a7a]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a3a52] mb-1">Endereço</h3>
                      <p className="text-gray-600">Av Dr Chucry Zaidan, 111, São Paulo - SP</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a3a52] mb-1">WhatsApp</h3>
                      <Button
                        onClick={handleWhatsAppContact}
                        className="bg-green-600 hover:bg-green-700 text-white mt-2 shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Conversar Agora
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-[#1a3a52] mb-4">Horário de Atendimento</h2>
                <div className="space-y-2 text-gray-600">
                  <p><span className="font-semibold">Segunda a Sexta:</span> 9h às 18h</p>
                  <p><span className="font-semibold">Sábado:</span> 9h às 13h</p>
                  <p><span className="font-semibold">Domingo:</span> Fechado</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
