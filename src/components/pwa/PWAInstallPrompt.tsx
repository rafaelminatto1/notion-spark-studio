import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Monitor, CheckCircle, Wifi, Zap, Shield } from 'lucide-react';
import type { PWACapabilities } from '../../services/PWAAdvancedService';
import { pwaAdvancedService } from '../../services/PWAAdvancedService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useToast } from '../ui/use-toast';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'banner' | 'modal' | 'compact';
  showBenefits?: boolean;
  autoShow?: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  className = '',
  variant = 'modal',
  showBenefits = true,
  autoShow = true,
}) => {
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const { toast } = useToast();

  // Check if prompt was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      setHasBeenDismissed(daysSinceDismissed < 7); // Show again after 7 days
    }
  }, []);

  // Initialize PWA service and listen for events
  useEffect(() => {
    const initializePWA = async () => {
      try {
        await pwaAdvancedService.initialize();
        setCapabilities(pwaAdvancedService.getCapabilities());
      } catch (error) {
        console.error('Failed to initialize PWA service:', error);
      }
    };

    initializePWA();

    // Listen for install prompt availability
    const handleInstallPromptAvailable = () => {
      const caps = pwaAdvancedService.getCapabilities();
      setCapabilities(caps);
      
      if (autoShow && !hasBeenDismissed && caps.installation.canInstall) {
        setIsVisible(true);
      }
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsVisible(false);
      setIsInstalling(false);
      setInstallProgress(0);
      
      toast({
        title: "App Installed Successfully!",
        description: "Notion Spark is now available on your device.",
        duration: 5000,
      });
      
      onInstall?.();
    };

    pwaAdvancedService.on('install-prompt-available', handleInstallPromptAvailable);
    pwaAdvancedService.on('app-installed', handleAppInstalled);

    return () => {
      pwaAdvancedService.off('install-prompt-available', handleInstallPromptAvailable);
      pwaAdvancedService.off('app-installed', handleAppInstalled);
    };
  }, [autoShow, hasBeenDismissed, onInstall, toast]);

  const handleInstall = useCallback(async () => {
    if (!capabilities?.installation.canInstall || isInstalling) return;

    setIsInstalling(true);
    setInstallProgress(0);

    // Simulate installation progress
    const progressInterval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const success = await pwaAdvancedService.installApp();
      
      clearInterval(progressInterval);
      setInstallProgress(100);
      
      if (success) {
        setTimeout(() => {
          setIsVisible(false);
          setIsInstalling(false);
          setInstallProgress(0);
        }, 1000);
      } else {
        setIsInstalling(false);
        setInstallProgress(0);
        
        toast({
          title: "Installation Cancelled",
          description: "You can install the app later from your browser menu.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Installation failed:', error);
      clearInterval(progressInterval);
      setIsInstalling(false);
      setInstallProgress(0);
      
      toast({
        title: "Installation Failed",
        description: "Please try again or install from your browser menu.",
        variant: "destructive",
      });
    }
  }, [capabilities, isInstalling, toast]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    onDismiss?.();
  }, [onDismiss]);

  const showPrompt = useCallback(() => {
    if (capabilities?.installation.canInstall) {
      setIsVisible(true);
    }
  }, [capabilities]);

  // Don't render if not available or already installed
  if (!capabilities || 
      capabilities.installation.isInstalled || 
      !capabilities.installation.canInstall ||
      (!isVisible && variant !== 'compact')) {
    return null;
  }

  const getBenefits = () => [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Lightning Fast",
      description: "Instant loading with offline access"
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      title: "Secure & Private",
      description: "Your data stays safe and private"
    },
    {
      icon: <Wifi className="w-5 h-5 text-blue-500" />,
      title: "Works Offline",
      description: "Access your notes without internet"
    },
    {
      icon: capabilities.platform.isMobile ? 
        <Smartphone className="w-5 h-5 text-purple-500" /> : 
        <Monitor className="w-5 h-5 text-purple-500" />,
      title: "Native Experience",
      description: `Optimized for ${capabilities.platform.isMobile ? 'mobile' : 'desktop'}`
    }
  ];

  const renderCompactVariant = () => (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-80 shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install Notion Spark</h3>
              <p className="text-xs text-muted-foreground">Get the full app experience</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} disabled={isInstalling}>
                {isInstalling ? 'Installing...' : 'Install'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBannerVariant = () => (
    <div className={`w-full bg-gradient-to-r from-primary/5 to-primary/10 border-b ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Install Notion Spark App</h3>
              <p className="text-sm text-muted-foreground">
                Get faster access and work offline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {capabilities.platform.os} • {capabilities.platform.browser}
            </Badge>
            <Button onClick={handleInstall} disabled={isInstalling}>
              {isInstalling ? 'Installing...' : 'Install App'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModalVariant = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Install Notion Spark</CardTitle>
          <p className="text-muted-foreground">
            Get the full app experience with offline access and faster performance
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Installation Progress */}
          {isInstalling && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Installing...</span>
                <span>{installProgress}%</span>
              </div>
              <Progress value={installProgress} className="h-2" />
            </div>
          )}

          {/* Platform Info */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            {capabilities.platform.isMobile ? (
              <Smartphone className="w-5 h-5 text-primary" />
            ) : (
              <Monitor className="w-5 h-5 text-primary" />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm">
                {capabilities.platform.isMobile ? 'Mobile' : 'Desktop'} App
              </div>
              <div className="text-xs text-muted-foreground">
                {capabilities.platform.os} • {capabilities.platform.browser}
              </div>
            </div>
            <Badge variant="outline">
              {capabilities.platform.isMobile ? 'Mobile' : 'Desktop'}
            </Badge>
          </div>

          {/* Benefits */}
          {showBenefits && (
            <div className="grid grid-cols-2 gap-3">
              {getBenefits().map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 mt-0.5">
                    {benefit.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{benefit.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {benefit.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleInstall} 
              disabled={isInstalling}
              className="flex-1"
              size="lg"
            >
              {isInstalling ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Installing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Install App
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              disabled={isInstalling}
              size="lg"
            >
              Later
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-muted-foreground">
            The app will be installed to your device and can be uninstalled anytime
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Manual trigger for compact variant
  if (variant === 'compact' && !isVisible) {
    return (
      <Button
        onClick={showPrompt}
        variant="outline"
        size="sm"
        className={className}
      >
        <Download className="w-4 h-4 mr-2" />
        Install App
      </Button>
    );
  }

  switch (variant) {
    case 'banner':
      return renderBannerVariant();
    case 'compact':
      return renderCompactVariant();
    case 'modal':
    default:
      return renderModalVariant();
  }
};

export default PWAInstallPrompt; 