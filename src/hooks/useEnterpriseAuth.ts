import { useState, useEffect, useCallback } from 'react';
import { enterpriseAuthService, type AuthState, type EnterpriseUser, type LoginCredentials } from '../services/EnterpriseAuthService';

export function useEnterpriseAuth() {
  const [authState, setAuthState] = useState<AuthState>(enterpriseAuthService.getAuthState());

  useEffect(() => {
    const unsubscribe = enterpriseAuthService.subscribe((state) => {
      setAuthState(state);
    });

    return unsubscribe;
  }, []);

  // Authentication Methods
  const signInWithEmail = useCallback(async (credentials: LoginCredentials) => {
    return await enterpriseAuthService.signInWithEmail(credentials);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, userData?: any) => {
    return await enterpriseAuthService.signUpWithEmail(email, password, userData);
  }, []);

  const signInWithSSO = useCallback(async (provider: 'google' | 'github' | 'microsoft' | 'slack') => {
    return await enterpriseAuthService.signInWithSSO(provider);
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    return await enterpriseAuthService.signInWithMagicLink(email);
  }, []);

  const signOut = useCallback(async () => {
    await enterpriseAuthService.signOut();
  }, []);

  // MFA Methods
  const enableMFA = useCallback(async () => {
    return await enterpriseAuthService.enableMFA();
  }, []);

  const verifyMFA = useCallback(async (code: string, factorId: string) => {
    return await enterpriseAuthService.verifyMFA(code, factorId);
  }, []);

  // Password Management
  const resetPassword = useCallback(async (email: string) => {
    return await enterpriseAuthService.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return await enterpriseAuthService.updatePassword(newPassword);
  }, []);

  // Organization Management
  const createOrganization = useCallback(async (orgData: any) => {
    return await enterpriseAuthService.createOrganization(orgData);
  }, []);

  const inviteUser = useCallback(async (email: string, role: string = 'member') => {
    return await enterpriseAuthService.inviteUser(email, role);
  }, []);

  // Profile Management
  const updateProfile = useCallback(async (updates: Partial<EnterpriseUser['profile']>) => {
    return await enterpriseAuthService.updateProfile(updates);
  }, []);

  // Security
  const checkSuspiciousActivity = useCallback(async () => {
    return await enterpriseAuthService.checkSuspiciousActivity();
  }, []);

  const refreshSession = useCallback(async () => {
    return await enterpriseAuthService.refreshSession();
  }, []);

  // Computed Values
  const isAuthenticated = authState.user !== null && authState.session !== null;
  const isLoading = authState.loading;
  const user = authState.user;
  const organization = authState.organization;
  const permissions = authState.permissions;

  // Permission Checks
  const canCreateWorkspaces = permissions?.canCreateWorkspaces || false;
  const canInviteUsers = permissions?.canInviteUsers || false;
  const canManageBilling = permissions?.canManageBilling || false;
  const canAccessAnalytics = permissions?.canAccessAnalytics || false;
  const hasAdminAccess = permissions?.adminAccess || false;

  // Organization Info
  const organizationTier = organization?.tier || 'free';
  const organizationLimits = organization?.limits || {
    users: 5,
    storage: 1024, // MB
    collaborators: 3
  };

  return {
    // State
    user,
    organization,
    permissions,
    isAuthenticated,
    isLoading,
    
    // Authentication
    signInWithEmail,
    signUpWithEmail,
    signInWithSSO,
    signInWithMagicLink,
    signOut,
    
    // MFA
    enableMFA,
    verifyMFA,
    
    // Password Management
    resetPassword,
    updatePassword,
    
    // Organization
    createOrganization,
    inviteUser,
    organizationTier,
    organizationLimits,
    
    // Profile
    updateProfile,
    
    // Security
    checkSuspiciousActivity,
    refreshSession,
    
    // Permissions
    canCreateWorkspaces,
    canInviteUsers,
    canManageBilling,
    canAccessAnalytics,
    hasAdminAccess,
    
    // SSO Providers
    availableProviders: enterpriseAuthService.getAvailableProviders()
  };
} 