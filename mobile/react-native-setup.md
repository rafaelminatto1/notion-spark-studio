# 📱 NOTION SPARK MOBILE - REACT NATIVE SETUP

## 🎯 **ARQUITETURA MOBILE ENTERPRISE**

### **📂 Estrutura de Projeto Recomendada**
```
notion-spark-mobile/
├── android/                    # Android native code
├── ios/                        # iOS native code  
├── src/
│   ├── components/            # Shared UI components
│   │   ├── mobile/           # Mobile-specific components
│   │   ├── tablet/           # Tablet-optimized components
│   │   └── shared/           # Cross-platform components
│   ├── screens/              # Screen components
│   │   ├── auth/            # Authentication screens
│   │   ├── dashboard/       # Dashboard screens
│   │   ├── editor/          # Document editor
│   │   └── settings/        # Settings screens
│   ├── navigation/           # Navigation configuration
│   ├── services/            # API & business logic
│   │   ├── api/            # API integration
│   │   ├── sync/           # Offline sync
│   │   └── push/           # Push notifications
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── store/               # State management (Redux/Zustand)
│   └── types/               # TypeScript definitions
├── __tests__/               # Test files
├── assets/                  # Images, fonts, etc.
├── package.json
└── metro.config.js         # Metro bundler config
```

## 🚀 **SETUP COMMANDS**

### **1. Inicialização do Projeto**
```bash
# Criar projeto React Native
npx react-native@latest init NotionSparkMobile --template react-native-template-typescript

# Navegar para diretório
cd NotionSparkMobile

# Instalar dependências essenciais
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
npm install react-native-gesture-handler
npm install react-native-reanimated
npm install react-native-svg

# Dependências específicas enterprise
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-keychain
npm install react-native-biometrics
npm install @react-native-community/netinfo
npm install react-native-background-sync
npm install react-native-document-picker
npm install react-native-share
```

### **2. Configuração iOS**
```bash
cd ios && pod install && cd ..
```

### **3. Configuração Android**
```bash
# Adicionar ao android/app/build.gradle
android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
    }
}
```

## 🔧 **CONFIGURAÇÕES ENTERPRISE**

### **📱 Push Notifications Setup**
```typescript
// src/services/push/PushNotificationService.ts
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export class MobilePushService {
  static async initialize() {
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    if (enabled) {
      const token = await messaging().getToken();
      return token;
    }
    return null;
  }

  static setupNotificationHandlers() {
    messaging().onMessage(async remoteMessage => {
      // Handle foreground notifications
      console.log('Foreground notification:', remoteMessage);
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      // Handle background notifications
      console.log('Background notification:', remoteMessage);
    });
  }
}
```

### **🔐 Biometric Authentication**
```typescript
// src/services/auth/BiometricAuth.ts
import ReactNativeBiometrics from 'react-native-biometrics';

export class BiometricAuthService {
  static async isAvailable(): Promise<boolean> {
    const { available } = await ReactNativeBiometrics.isSensorAvailable();
    return available;
  }

  static async authenticate(): Promise<boolean> {
    try {
      const { success } = await ReactNativeBiometrics.simplePrompt({
        promptMessage: 'Authenticate to access Notion Spark',
        cancelButtonText: 'Cancel'
      });
      return success;
    } catch {
      return false;
    }
  }

  static async createKeys(): Promise<string | null> {
    try {
      const { publicKey } = await ReactNativeBiometrics.createKeys();
      return publicKey;
    } catch {
      return null;
    }
  }
}
```

### **🔄 Offline Sync Service**
```typescript
// src/services/sync/OfflineSyncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

export class MobileOfflineSyncService {
  private static pendingOperations: PendingOperation[] = [];
  private static isOnline = true;

  static async initialize() {
    // Load pending operations from storage
    const stored = await AsyncStorage.getItem('pendingOperations');
    if (stored) {
      this.pendingOperations = JSON.parse(stored);
    }

    // Listen for network changes
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        this.syncPendingOperations();
      }
    });
  }

  static async queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>) {
    const queuedOp: PendingOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    };

    this.pendingOperations.push(queuedOp);
    await this.persistOperations();

    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  private static async syncPendingOperations() {
    const operations = [...this.pendingOperations];
    
    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        this.pendingOperations = this.pendingOperations.filter(op => op.id !== operation.id);
      } catch (error) {
        operation.retries++;
        if (operation.retries >= 3) {
          this.pendingOperations = this.pendingOperations.filter(op => op.id !== operation.id);
        }
      }
    }

    await this.persistOperations();
  }

  private static async executeOperation(operation: PendingOperation) {
    // Execute the operation via API
    // This would integrate with your existing API services
    console.log('Executing operation:', operation);
  }

  private static async persistOperations() {
    await AsyncStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
  }
}
```

## 🎨 **COMPONENTES MOBILE-FIRST**

### **📝 Mobile Editor Component**
```typescript
// src/components/mobile/MobileEditor.tsx
import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MobileEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

export const MobileEditor: React.FC<MobileEditorProps> = ({
  initialContent = '',
  onContentChange,
  readOnly = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    onContentChange?.(text);
  }, [onContentChange]);

  React.useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TextInput
        style={[
          styles.editor,
          keyboardVisible && styles.editorKeyboardActive
        ]}
        value={content}
        onChangeText={handleContentChange}
        multiline
        placeholder="Start writing..."
        placeholderTextColor="#9CA3AF"
        editable={!readOnly}
        textAlignVertical="top"
        scrollEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editor: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editorKeyboardActive: {
    paddingBottom: 80,
  },
});
```

### **📊 Mobile Dashboard**
```typescript
// src/screens/dashboard/MobileDashboard.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MobileDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh data
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Good morning! Ready to be productive?</Text>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {/* Add quick action buttons */}
      </View>

      {/* Recent Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Documents</Text>
        {/* Add document list */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
});
```

## 🔐 **SEGURANÇA MOBILE ENTERPRISE**

### **Keychain Storage (iOS) / Keystore (Android)**
```typescript
// src/services/security/SecureStorage.ts
import * as Keychain from 'react-native-keychain';

export class SecureStorageService {
  static async storeCredentials(username: string, password: string): Promise<boolean> {
    try {
      await Keychain.setInternetCredentials(
        'notion-spark-server',
        username,
        password,
        {
          securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  static async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('notion-spark-server');
      if (credentials) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
    } catch {}
    return null;
  }

  static async removeCredentials(): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials('notion-spark-server');
      return true;
    } catch {
      return false;
    }
  }
}
```

## 📊 **PERFORMANCE MOBILE**

### **Bundle Size Optimization**
```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable tree shaking
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Bundle splitting
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => (path) => {
    // Create stable module IDs for better caching
    return require('crypto').createHash('md5').update(path).digest('hex').substr(0, 8);
  },
};

module.exports = config;
```

### **Memory Management**
```typescript
// src/utils/MemoryManager.ts
export class MobileMemoryManager {
  private static cache = new Map();
  private static readonly MAX_CACHE_SIZE = 50;

  static cacheItem(key: string, value: any) {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  static getCacheItem(key: string) {
    return this.cache.get(key);
  }

  static clearCache() {
    this.cache.clear();
  }

  static getMemoryUsage() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      usagePercentage: (this.cache.size / this.MAX_CACHE_SIZE) * 100
    };
  }
}
```

## 🚀 **DEPLOYMENT CONFIGURAÇÕES**

### **App Store Connect (iOS)**
```xml
<!-- ios/NotionSparkMobile/Info.plist -->
<dict>
    <key>CFBundleDisplayName</key>
    <string>Notion Spark</string>
    <key>CFBundleIdentifier</key>
    <string>com.notionspark.mobile</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>NSCameraUsageDescription</key>
    <string>Take photos for your documents</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Location access for geo-tagging</string>
    <key>NSFaceIDUsageDescription</key>
    <string>Use Face ID for secure authentication</string>
</dict>
```

### **Google Play Console (Android)**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
            android:windowSoftInputMode="adjustResize">
        </activity>
    </application>
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
</manifest>
```

## 🎯 **PRÓXIMOS PASSOS**

### **Implementação Priorities**
1. ✅ **Core Setup** - React Native + TypeScript
2. 🔄 **Authentication** - Biometric + SSO integration  
3. 🔄 **Offline Sync** - Background sync service
4. 🔄 **Push Notifications** - Firebase integration
5. 🔄 **Mobile Editor** - Touch-optimized editor
6. 🔄 **Performance** - Bundle optimization

### **Launch Timeline**
- **Week 1-2**: Core setup + Authentication
- **Week 3-4**: Editor + Sync functionality  
- **Week 5-6**: Push notifications + Polish
- **Week 7-8**: Testing + Store submission

---

**🚀 MOBILE ECOSYSTEM READY FOR DEVELOPMENT!** 