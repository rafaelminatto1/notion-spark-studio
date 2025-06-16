'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  Zap, 
  Database,
  Settings2,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: Brain,
    title: 'IA Avançada',
    description: 'Sistema de inteligência artificial que aprende com seus padrões de trabalho e sugere otimizações automáticas.',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    icon: Zap,
    title: 'Performance Extrema',
    description: 'Arquitetura otimizada com cache inteligente, lazy loading e preload preditivo para máxima velocidade.',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Segurança Robusta',
    description: 'Criptografia end-to-end, backup automático e sistema de monitoramento de integridade em tempo real.',
    color: 'from-green-400 to-emerald-600'
  },
  {
    icon: Database,
    title: 'Sincronização Real-time',
    description: 'Colaboração em tempo real com conflito automático de merge e histórico completo de versões.',
    color: 'from-purple-400 to-pink-600'
  },
  {
    icon: Settings2,
    title: 'Automação Inteligente',
    description: 'Workflows automatizados com triggers customizáveis e integração profunda com APIs externas.',
    color: 'from-cyan-400 to-blue-600'
  },
  {
    icon: Activity,
    title: 'Analytics Avançado',
    description: 'Dashboard com métricas detalhadas, insights de produtividade e relatórios personalizáveis.',
    color: 'from-red-400 to-rose-600'
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Sobre o Notion Spark Studio</h1>
              <p className="text-muted-foreground">Conheça os recursos da plataforma</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* Descrição principal */}
          <motion.div variants={fadeInUp} className="text-center space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
              Plataforma Interna
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Recursos que Definem nossa{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Produtividade
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sistema completo desenvolvido para maximizar a produtividade da equipe com tecnologias de ponta.
            </p>
          </motion.div>

          {/* Grid de recursos */}
          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Informações técnicas */}
          <motion.div variants={fadeInUp} className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Especificações Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Tecnologias</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Next.js 15 com App Router</li>
                    <li>• React 18 com Server Components</li>
                    <li>• TypeScript para type safety</li>
                    <li>• Tailwind CSS para styling</li>
                    <li>• Framer Motion para animações</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Bundle otimizado (181kB First Load)</li>
                    <li>• Lazy loading inteligente</li>
                    <li>• Cache avançado com Service Workers</li>
                    <li>• Preload preditivo de rotas</li>
                    <li>• Monitoramento em tempo real</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
} 