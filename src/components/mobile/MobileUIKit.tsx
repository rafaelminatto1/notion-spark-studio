import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  PanGestureHandler, 
  State,
  Dimensions,
  Platform,
  Haptics
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types for mobile components
interface MobileCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  elevation?: number;
  hapticFeedback?: boolean;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
}

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  backgroundColor?: string;
  animated?: boolean;
}

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  snapPoints?: string[];
  initialSnapPoint?: number;
  backgroundOpacity?: number;
}

interface MobileTabsProps {
  tabs: { id: string; title: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  pullToRefreshOffset?: number;
}

// Enhanced Mobile Card Component
export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  elevation = 2,
  hapticFeedback = true,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [scaleAnim, hapticFeedback]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [scaleAnim]);

  const handleLongPress = useCallback(() => {
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  }, [onLongPress, hapticFeedback]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      {...props}
    >
      <Animated.View
        style={[
          styles.card,
          {
            elevation,
            shadowOpacity: elevation * 0.1,
            shadowOffset: { width: 0, height: elevation },
            shadowRadius: elevation * 2,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Swipeable Item Component with Actions
export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftActions,
  rightActions,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const panRef = useRef<PanGestureHandler>(null);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const handleStateChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;

        if (translationX > swipeThreshold) {
          // Swipe right
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            onSwipeRight?.();
            translateX.setValue(0);
          });
        } else if (translationX < -swipeThreshold) {
          // Swipe left
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            onSwipeLeft?.();
            translateX.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 300,
            friction: 30,
          }).start();
        }
      }
    },
    [translateX, swipeThreshold, onSwipeLeft, onSwipeRight]
  );

  return (
    <View style={styles.swipeableContainer}>
      {/* Left Actions */}
      {leftActions && (
        <View style={[styles.actionContainer, styles.leftActions]}>
          {leftActions}
        </View>
      )}

      {/* Right Actions */}
      {rightActions && (
        <View style={[styles.actionContainer, styles.rightActions]}>
          {rightActions}
        </View>
      )}

      {/* Main Content */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.swipeableContent,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Floating Action Button
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  size = 'medium',
  position = 'bottom-right',
  backgroundColor = '#3B82F6',
  animated = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: 500,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }).start();
    }
  }, [scaleAnim, animated]);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  }, [onPress, rotateAnim]);

  const sizeStyles = {
    small: { width: 48, height: 48 },
    medium: { width: 56, height: 56 },
    large: { width: 64, height: 64 },
  };

  const positionStyles = {
    'bottom-right': { bottom: insets.bottom + 16, right: 16 },
    'bottom-left': { bottom: insets.bottom + 16, left: 16 },
    'bottom-center': { bottom: insets.bottom + 16, alignSelf: 'center' },
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.fab,
        sizeStyles[size],
        positionStyles[position],
        { backgroundColor },
        {
          transform: [{ scale: scaleAnim }, { rotate }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fabTouchable}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Bottom Sheet Component
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onDismiss,
  children,
  snapPoints = ['50%', '80%'],
  initialSnapPoint = 0,
  backgroundOpacity = 0.5,
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const panRef = useRef<PanGestureHandler>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight * (1 - parseFloat(snapPoints[currentSnapPoint]) / 100),
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: backgroundOpacity,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, currentSnapPoint, snapPoints, translateY, backdropOpacity, backgroundOpacity]);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationY } = event.nativeEvent;
        
        if (translationY > 100) {
          onDismiss();
        } else {
          // Snap to nearest point
          const targetY = screenHeight * (1 - parseFloat(snapPoints[currentSnapPoint]) / 100);
          Animated.spring(translateY, {
            toValue: targetY,
            useNativeDriver: true,
            tension: 300,
            friction: 30,
          }).start();
        }
      }
    },
    [translateY, currentSnapPoint, snapPoints, onDismiss]
  );

  if (!visible) return null;

  return (
    <View style={styles.bottomSheetOverlay}>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropOpacity },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onDismiss}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Bottom Sheet */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetY={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.bottomSheetHandle} />
          
          {/* Content */}
          <View style={styles.bottomSheetContent}>
            {children}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Mobile Tabs Component
export const MobileTabs: React.FC<MobileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const tabWidth = screenWidth / tabs.length;

  const indicatorLeft = scrollX.interpolate({
    inputRange: tabs.map((_, index) => index * tabWidth),
    outputRange: tabs.map((_, index) => index * tabWidth),
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsHeader}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              { width: tabWidth },
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => {
              onTabChange(tab.id);
              if (Platform.OS === 'ios') {
                Haptics.selectionAsync();
              }
              
              Animated.timing(scrollX, {
                toValue: index * tabWidth,
                duration: 250,
                useNativeDriver: false,
              }).start();
            }}
          >
            {tab.icon}
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
        
        {variant === 'underline' && (
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                left: indicatorLeft,
                width: tabWidth,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
};

// Pull to Refresh Component
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing,
  pullToRefreshOffset = 100,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const refreshOpacity = useRef(new Animated.Value(0)).current;
  const panRef = useRef<PanGestureHandler>(null);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = useCallback(
    async (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationY } = event.nativeEvent;
        
        if (translationY > pullToRefreshOffset && !refreshing) {
          // Trigger refresh
          Animated.timing(refreshOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
          
          await onRefresh();
          
          Animated.timing(refreshOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        // Reset position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 30,
        }).start();
      }
    },
    [translateY, refreshOpacity, onRefresh, refreshing, pullToRefreshOffset]
  );

  return (
    <View style={styles.pullToRefreshContainer}>
      {/* Refresh Indicator */}
      <Animated.View
        style={[
          styles.refreshIndicator,
          { opacity: refreshOpacity },
        ]}
      >
        <Text style={styles.refreshText}>Refreshing...</Text>
      </Animated.View>

      {/* Content */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetY={[0, 10]}
      >
        <Animated.View
          style={[
            styles.pullToRefreshContent,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  // Swipeable styles
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeableContent: {
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    zIndex: 0,
  },
  leftActions: {
    left: 0,
    backgroundColor: '#10B981',
  },
  rightActions: {
    right: 0,
    backgroundColor: '#EF4444',
  },

  // FAB styles
  fab: {
    position: 'absolute',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },

  // Bottom Sheet styles
  bottomSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: screenHeight * 0.5,
    maxHeight: screenHeight * 0.9,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },

  // Tabs styles
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsHeader: {
    flexDirection: 'row',
    position: 'relative',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#3B82F6',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#3B82F6',
  },

  // Pull to Refresh styles
  pullToRefreshContainer: {
    flex: 1,
    position: 'relative',
  },
  refreshIndicator: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 2,
  },
  refreshText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  pullToRefreshContent: {
    flex: 1,
  },
});

// Export all components
export {
  MobileCard,
  SwipeableItem,
  FloatingActionButton,
  BottomSheet,
  MobileTabs,
  PullToRefresh,
};

// Mobile UI Kit Hook
export const useMobileUIKit = () => {
  const insets = useSafeAreaInsets();
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }
  }, []);

  return {
    insets,
    orientation,
    screenWidth,
    screenHeight,
    hapticFeedback,
    isTablet: screenWidth > 768,
    isLandscape: orientation === 'landscape',
  };
};

export default {
  MobileCard,
  SwipeableItem,
  FloatingActionButton,
  BottomSheet,
  MobileTabs,
  PullToRefresh,
  useMobileUIKit,
}; 