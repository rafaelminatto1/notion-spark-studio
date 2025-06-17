import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getSupabaseClient, supabaseStatus, testSupabaseConnection } from '@/lib/supabase-unified';

export function SupabaseStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error' | 'unconfigured'>('testing');
  const [lastTest, setLastTest] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      if (!isConnected) {
        setError('Não foi possível conectar ao Supabase');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLastTest(new Date());
    }
  };

  useEffect(() => {
    if (!supabaseStatus.isConfigured) {
      setConnectionStatus('unconfigured');
      return;
    }
    
    testConnection();
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'unconfigured':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge variant="secondary">Testando...</Badge>;
      case 'connected':
        return <Badge variant="default" className="bg-green-600">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'unconfigured':
        return <Badge variant="secondary" className="bg-yellow-600">Não Configurado</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Status do Supabase
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Verificação de conectividade e configuração do banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Configurado:</strong> {supabaseStatus.isConfigured ? '✅ Sim' : '❌ Não'}
          </div>
          <div>
            <strong>Cliente Criado:</strong> {supabaseStatus.isConnected ? '✅ Sim' : '❌ Não'}
          </div>
          {supabaseStatus.config && (
            <>
              <div>
                <strong>URL:</strong> {supabaseStatus.config.url.substring(0, 30)}...
              </div>
              <div>
                <strong>Chave:</strong> {supabaseStatus.config.hasKey ? '✅ Configurada' : '❌ Ausente'}
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Erro:</strong> {error}
            </p>
          </div>
        )}

        {lastTest && (
          <p className="text-xs text-muted-foreground">
            Última verificação: {lastTest.toLocaleTimeString()}
          </p>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
        >
          {connectionStatus === 'testing' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            'Testar Conexão'
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 