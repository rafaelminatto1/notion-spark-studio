import { useState, useEffect } from 'react';

interface AppleDeviceInfo {
  isIOS: boolean;
  isIPad: boolean;
  isIPhone: boolean;
  deviceModel: string;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  supportsPWA: boolean;
  safePadding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface UseAppleDeviceReturn extends AppleDeviceInfo {
  isTargetDevice: boolean; // iPhone 11-16 ou iPad 10
  optimizedSpacing: {
    toolbar: string;
    content: string;
    bottom: string;
  };
  touchTargetSize: string;
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
}

export function useAppleDevice(): UseAppleDeviceReturn {
  const [deviceInfo, setDeviceInfo] = useState<AppleDeviceInfo>({
    isIOS: false,
    isIPad: false,
    isIPhone: false,
    deviceModel: 'unknown',
    screenSize: 'medium',
    hasNotch: false,
    hasDynamicIsland: false,
    supportsPWA: false,
    safePadding: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isIPad = /iPad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isIPhone = /iPhone/.test(userAgent);
      
      // Detectar modelos específicos
      let deviceModel = 'unknown';
      let hasNotch = false;
      let hasDynamicIsland = false;
      let screenSize: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';

      if (isIPhone) {
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        
        // iPhone models detection
        if (screenWidth === 414 && screenHeight === 896) {
          deviceModel = 'iPhone 11/XR';
          hasNotch = true;
          screenSize = 'large';
        } else if (screenWidth === 390 && screenHeight === 844) {
          deviceModel = 'iPhone 12/13 mini';
          hasNotch = true;
          screenSize = 'medium';
        } else if (screenWidth === 428 && screenHeight === 926) {
          deviceModel = 'iPhone 12/13 Pro Max';
          hasNotch = true;
          screenSize = 'xlarge';
        } else if (screenWidth === 393 && screenHeight === 852) {
          deviceModel = 'iPhone 14/15';
          hasDynamicIsland = true;
          screenSize = 'large';
        } else if (screenWidth === 430 && screenHeight === 932) {
          deviceModel = 'iPhone 14/15 Pro Max';
          hasDynamicIsland = true;
          screenSize = 'xlarge';
        } else if (screenWidth >= 390) {
          deviceModel = 'iPhone 16 series';
          hasDynamicIsland = true;
          screenSize = screenWidth > 400 ? 'xlarge' : 'large';
        }
      } else if (isIPad) {
        const screenWidth = window.screen.width;
        if (screenWidth >= 820 && screenWidth <= 834) {
          deviceModel = 'iPad 10';
          screenSize = 'xlarge';
        }
      }

      // Calcular safe areas
      const safePadding = {
        top: hasNotch || hasDynamicIsland ? 44 : 20,
        bottom: isIOS ? 34 : 0,
        left: 0,
        right: 0
      };

      // PWA support detection
      const supportsPWA = 'serviceWorker' in navigator && 'PushManager' in window;

      setDeviceInfo({
        isIOS,
        isIPad,
        isIPhone,
        deviceModel,
        screenSize,
        hasNotch,
        hasDynamicIsland,
        supportsPWA,
        safePadding
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  // Determinar se é um dispositivo alvo
  const isTargetDevice = 
    (deviceInfo.isIPhone && (
      deviceInfo.deviceModel.includes('11') ||
      deviceInfo.deviceModel.includes('12') ||
      deviceInfo.deviceModel.includes('13') ||
      deviceInfo.deviceModel.includes('14') ||
      deviceInfo.deviceModel.includes('15') ||
      deviceInfo.deviceModel.includes('16')
    )) ||
    (deviceInfo.isIPad && deviceInfo.deviceModel.includes('iPad 10'));

  // Otimizações específicas
  const optimizedSpacing = {
    toolbar: deviceInfo.hasNotch || deviceInfo.hasDynamicIsland 
      ? `${deviceInfo.safePadding.top + 16}px` 
      : '20px',
    content: deviceInfo.isIPad ? '24px' : '16px',
    bottom: `${deviceInfo.safePadding.bottom + 16}px`
  };

  const touchTargetSize = deviceInfo.isIPad ? '48px' : '44px';

  const fontSize = {
    small: deviceInfo.screenSize === 'small' ? '14px' : '16px',
    medium: deviceInfo.screenSize === 'small' ? '16px' : '18px',
    large: deviceInfo.screenSize === 'small' ? '18px' : '20px'
  };

  return {
    ...deviceInfo,
    isTargetDevice,
    optimizedSpacing,
    touchTargetSize,
    fontSize
  };
} 