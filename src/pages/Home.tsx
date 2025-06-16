import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Brain, 
  Shield, 
  Zap, 
  Database,
  Settings2,
  PhoneCall,
  Github,
  Star,
  Users,
  FileText,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';

// Dados dinâmicos para demonstração
const stats = [
  { icon: Users, label: 'Usuários Ativos', value: '2.4K+', growth: '+12%' },
  { icon: FileText, label: 'Templates Criados', value: '18K+', growth: '+34%' },
  { icon: Brain, label: 'IA Interações', value: '156K+', growth: '+89%' },
  { icon: Activity, label: 'Uptime', value: '99.9%', growth: 'Estável' }
];

const features = [
  {
    icon: Brain,
    title: 'IA Avançada',
    description: 'Sistema de inteligência artificial que aprende com seu comportamento e otimiza automaticamente seus templates e workflows.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Shield,
    title: 'Máxima Segurança',
    description: 'Proteção avançada com backup automático, criptografia end-to-end e sistemas de recuperação resilientes.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Zap,
    title: 'Performance Extrema',
    description: 'Cache inteligente, lazy loading e otimizações que tornam sua experiência 45% mais rápida que a concorrência.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Settings2,
    title: 'Customização Total',
    description: 'Controle completo sobre design, funcionalidades e integrações. Adapte tudo às suas necessidades específicas.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Database,
    title: 'Integração Notion',
    description: 'Conecta perfeitamente com Notion, sincroniza dados em tempo real e mantém tudo sempre atualizado.',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Sparkles,
    title: 'Templates Inteligentes',
    description: 'Biblioteca com centenas de templates que se adaptam automaticamente ao seu estilo e necessidades.',
    color: 'from-rose-500 to-red-500'
  }
];

const testimonials = [
  {
    name: 'Sofia Rodrigues',
    role: 'Product Manager',
    company: 'Tech Startup',
    content: 'O Notion Spark revolucionou nossa produtividade. Economia de 3 horas por dia na criação de documentos.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
  },
  {
    name: 'Carlos Henrique',
    role: 'CEO',
    company: 'Digital Agency',
    content: 'Templates incríveis e IA que realmente entende o que preciso. Melhor investimento do ano!',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  },
  {
    name: 'Ana Costa',
    role: 'Designer',
    company: 'Creative Studio',
    content: 'Interface linda e funcionalidades poderosas. Finalmente um sistema que combina design e performance.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
  }
];

const Home: React.FC = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-4 pt-32">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="container mx-auto text-center">
          <motion.div
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp}>
              <Badge variant="outline" className="animate-pulse gap-2 bg-primary/10 border-primary/20">
                <Sparkles className="h-4 w-4" />
                Novo: IA Avançada Implementada
                <ArrowRight className="h-3 w-3" />
              </Badge>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight"
            >
              Transforme seu Notion com{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                IA Avançada
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Plataforma revolucionária que combina inteligência artificial, templates inteligentes e 
              performance extrema para criar a experiência Notion mais avançada do mundo.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                onClick={() => router.push('/dashboard')}
              >
                Começar Agora
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2"
                onClick={() => router.push('/ai')}
              >
                <Github className="h-4 w-4" />
                Ver Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xs text-green-600">{stat.growth}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-16"
          >
            {/* Section Header */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">
                Recursos que Definem o{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Futuro
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Sistema completo de próxima geração construído para profissionais que exigem o máximo de produtividade.
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="group relative overflow-hidden border-0 bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 h-full">
                    {/* Gradient Border Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg`} />
                    
                    <CardHeader className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-2.5 flex items-center justify-center`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-12"
          >
            <motion.div variants={fadeInUp} className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Confiado por Milhares de Profissionais
              </h2>
              <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-lg font-medium">4.9/5 • 2.4K+ avaliações</span>
              </div>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="border-0 bg-background/60 backdrop-blur-sm h-full">
                    <CardContent className="p-6 space-y-4">
                      <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                      <div className="flex items-center gap-3">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role} • {testimonial.company}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <Card className="max-w-4xl mx-auto border-0 bg-background/80 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-12 space-y-8">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Oferta Especial
                </Badge>
                
                <h2 className="text-3xl md:text-5xl font-bold">
                  Pronto para Revolucionar seu{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Workflow?
                  </span>
                </h2>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Junte-se a milhares de profissionais que já transformaram sua produtividade com 
                  nossa plataforma de IA avançada. Comece gratuitamente hoje.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    onClick={() => router.push('/dashboard')}
                  >
                    Começar Gratuitamente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2"
                    onClick={() => router.push('/settings')}
                  >
                    <PhoneCall className="h-4 w-4" />
                    Falar com Especialista
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-8 pt-8 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">30 dias</div>
                    <div className="text-sm text-muted-foreground">Teste grátis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground">Suporte</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Notion Spark Studio</h3>
              <p className="text-muted-foreground text-sm">
                Transformando produtividade com inteligência artificial avançada.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="w-10 h-10 p-0">
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Produto</h4>
              <div className="space-y-2 text-sm">
                <a href="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
                <a href="/ai" className="block text-muted-foreground hover:text-foreground transition-colors">IA Workspace</a>
                <a href="/notion" className="block text-muted-foreground hover:text-foreground transition-colors">Integração Notion</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Recursos</h4>
              <div className="space-y-2 text-sm">
                <a href="/performance" className="block text-muted-foreground hover:text-foreground transition-colors">Performance</a>
                <a href="/settings" className="block text-muted-foreground hover:text-foreground transition-colors">Configurações</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Documentação</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Suporte</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Central de Ajuda</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Contato</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Status</a>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Notion Spark Studio. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;