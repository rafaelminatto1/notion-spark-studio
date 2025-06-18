import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Keyboard, Mouse, Eye, Settings, Zap } from 'lucide-react';

interface GraphHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GraphHelpOverlay: React.FC<GraphHelpOverlayProps> = ({
  isOpen,
  onClose
}) => {
  const shortcuts = [
    { category: '🎯 Navegação', items: [
      { key: 'R', description: 'Reset filtros e posição' },
      { key: 'F', description: 'Zoom para caber tudo' },
      { key: '+/-', description: 'Zoom in/out' },
      { key: 'ESC', description: 'Cancelar ação atual' },
    ]},
    { category: '🎨 Layouts', items: [
      { key: '1', description: '⚡ Force - Dinâmico' },
      { key: '2', description: '🌳 Hierárquico - Árvore' },
      { key: '3', description: '🔄 Circular - Círculo' },
      { key: '4', description: '📅 Timeline - Por data' },
      { key: '5', description: '🎯 Clusters - Agrupado' },
    ]},
    { category: '🔧 Ferramentas', items: [
      { key: 'P', description: 'Modo pathfinding' },
      { key: 'S', description: 'Configurações' },
      { key: 'M', description: 'Toggle minimap' },
      { key: 'A', description: 'Toggle analytics' },
    ]},
  ];

  const mouseControls = [
    { action: 'Clique', description: 'Selecionar nó' },
    { action: 'Duplo clique', description: 'Focar no nó' },
    { action: 'Arrastar', description: 'Mover nó' },
    { action: 'Scroll', description: 'Zoom in/out' },
    { action: 'Clique + Arrasto', description: 'Pan da visualização' },
    { action: 'Hover', description: 'Destacar conexões' },
  ];

  const features = [
    { icon: '🔍', title: 'Busca Inteligente', description: 'Busque por nomes, tags ou conteúdo' },
    { icon: '🚀', title: 'Pathfinding', description: 'Encontre o caminho mais curto entre arquivos' },
    { icon: '📊', title: 'Analytics', description: 'Métricas avançadas de rede em tempo real' },
    { icon: '🎯', title: 'Filtros', description: 'Filtre por conexões, tipos, órfãos' },
    { icon: '⚡', title: 'Performance', description: 'Otimizado para milhares de arquivos' },
    { icon: '🎨', title: 'Temas', description: 'Visual moderno com dark mode' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="graph-card max-w-4xl max-h-[90vh] overflow-y-auto p-8 m-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => { e.stopPropagation(); }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🧠
                  </motion.span>
                  Graph View Pro
                </h2>
                <p className="text-gray-400 mt-2">Visualização inteligente de conhecimento</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="graph-button text-white p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Atalhos de Teclado */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="graph-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Keyboard className="h-5 w-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Atalhos de Teclado</h3>
                  </div>
                  <div className="space-y-4">
                    {shortcuts.map((section, index) => (
                      <motion.div
                        key={section.category}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <h4 className="text-sm font-medium text-gray-300 mb-2">{section.category}</h4>
                        <div className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <motion.div
                              key={item.key}
                              className="flex items-center justify-between text-sm"
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.1 + itemIndex * 0.05 }}
                            >
                              <span className="analytics-metric px-2 py-1 min-w-[32px] text-center text-xs font-mono">
                                {item.key}
                              </span>
                              <span className="text-gray-400 flex-1 ml-3">{item.description}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Controles do Mouse */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="graph-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Mouse className="h-5 w-5 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Controles do Mouse</h3>
                  </div>
                  <div className="space-y-3">
                    {mouseControls.map((control, index) => (
                      <motion.div
                        key={control.action}
                        className="flex items-center justify-between text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <span className="analytics-metric px-3 py-1 text-center text-xs">
                          {control.action}
                        </span>
                        <span className="text-gray-400 flex-1 ml-3">{control.description}</span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Features */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="graph-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Features Principais</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      className="analytics-metric p-4 text-left"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                      <p className="text-xs text-gray-400">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-gray-500 text-sm">
                💡 Dica: Pressione <kbd className="px-2 py-1 bg-white/10 rounded text-xs">?</kbd> a qualquer momento para ver esta ajuda
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 