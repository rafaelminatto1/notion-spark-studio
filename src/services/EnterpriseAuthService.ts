import { supabaseClient } from '../lib/supabase-unified';
import type { User, Session } from '@supabase/supabase-js';

export interface EnterpriseUser extends User {
  organization?: {
    id: string;
    name: string;
    tier: 'free' | 'pro' | 'enterprise';
    limits: {
      users: number;
      storage: number;
      collaborators: number;
    };
  };
  permissions?: {
    canCreateWorkspaces: boolean;
    canInviteUsers: boolean;
    canManageBilling: boolean;
    canAccessAnalytics: boolean;
    adminAccess: boolean;
  };
  profile?: {
    avatar_url?: string;
    full_name?: string;
    department?: string;
    role?: string;
    timezone?: string;
  };
}

export interface AuthState {
  user: EnterpriseUser | null;
  session: Session | null;
  loading: boolean;
  organization: any;
  permissions: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

class EnterpriseAuthService {
  private static instance: EnterpriseAuthService;
  private authState: AuthState = {
    user: null,
    session: null,
    loading: true,
    organization: null,
    permissions: null
  };
  private listeners: ((state: AuthState) => void)[] = [];

  // Singleton pattern
  public static getInstance(): EnterpriseAuthService {
    if (!EnterpriseAuthService.instance) {
      EnterpriseAuthService.instance = new EnterpriseAuthService();
    }
    return EnterpriseAuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session?.user) {
        await this.loadUserProfile(session.user);
      }
      
      this.updateAuthState({
        session,
        user: session?.user as EnterpriseUser || null,
        loading: false
      });

      // Listen for auth changes
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log(`[Auth] State changed: ${event}`);
        
        if (session?.user) {
          await this.loadUserProfile(session.user);
        }
        
        this.updateAuthState({
          session,
          user: session?.user as EnterpriseUser || null,
          loading: false
        });
      });
    } catch (error) {
      console.error('[Auth] Initialization error:', error);
      this.updateAuthState({ loading: false });
    }
  }

  private async loadUserProfile(user: User): Promise<void> {
    try {
      // Load user profile
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Load organization
      const { data: orgMember } = await supabaseClient
        .from('organization_members')
        .select(`
          organization:organizations(*),
          role,
          permissions
        `)
        .eq('user_id', user.id)
        .single();

      // Enhance user object
      const enhancedUser = user as EnterpriseUser;
      enhancedUser.profile = profile;
      enhancedUser.organization = orgMember?.organization;
      enhancedUser.permissions = this.parsePermissions(orgMember?.role, orgMember?.permissions);

      this.updateAuthState({
        user: enhancedUser,
        organization: orgMember?.organization,
        permissions: enhancedUser.permissions
      });
    } catch (error) {
      console.error('[Auth] Profile loading error:', error);
    }
  }

  private parsePermissions(role: string, customPermissions: any) {
    const basePermissions = {
      canCreateWorkspaces: false,
      canInviteUsers: false,
      canManageBilling: false,
      canAccessAnalytics: false,
      adminAccess: false
    };

    // Role-based permissions
    switch (role) {
      case 'admin':
        return { ...basePermissions, adminAccess: true, canManageBilling: true, canAccessAnalytics: true, canInviteUsers: true, canCreateWorkspaces: true };
      case 'manager':
        return { ...basePermissions, canAccessAnalytics: true, canInviteUsers: true, canCreateWorkspaces: true };
      case 'member':
        return { ...basePermissions, canCreateWorkspaces: true };
      default:
        return { ...basePermissions, ...customPermissions };
    }
  }

  // Email/Password Authentication
  public async signInWithEmail(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true });

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        this.updateAuthState({ loading: false });
        return { success: false, error: error.message };
      }

      // Track login event
      await this.trackAuthEvent('login', 'email', data.user?.id);
      
      return { success: true };
    } catch (error) {
      this.updateAuthState({ loading: false });
      return { success: false, error: 'Login failed' };
    }
  }

  public async signUpWithEmail(email: string, password: string, userData?: any): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true });

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        this.updateAuthState({ loading: false });
        return { success: false, error: error.message };
      }

      // Create user profile
      if (data.user) {
        await this.createUserProfile(data.user, userData);
      }

      await this.trackAuthEvent('signup', 'email', data.user?.id);
      
      return { success: true };
    } catch (error) {
      this.updateAuthState({ loading: false });
      return { success: false, error: 'Registration failed' };
    }
  }

  // SSO Authentication
  public async signInWithSSO(provider: 'google' | 'github' | 'microsoft' | 'slack'): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true });

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        this.updateAuthState({ loading: false });
        return { success: false, error: error.message };
      }

      await this.trackAuthEvent('login', provider);
      
      return { success: true };
    } catch (error) {
      this.updateAuthState({ loading: false });
      return { success: false, error: `${provider} login failed` };
    }
  }

  // Magic Link Authentication
  public async signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await this.trackAuthEvent('magic_link', 'email');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Magic link failed' };
    }
  }

  // Multi-Factor Authentication
  public async enableMFA(): Promise<{ success: boolean; error?: string; qrCode?: string }> {
    try {
      const { data, error } = await supabaseClient.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        qrCode: data.qr_code 
      };
    } catch (error) {
      return { success: false, error: 'MFA setup failed' };
    }
  }

  public async verifyMFA(code: string, factorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabaseClient.auth.mfa.verify({
        factorId,
        challengeId: code,
        code
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'MFA verification failed' };
    }
  }

  // Session Management
  public async signOut(): Promise<void> {
    try {
      await this.trackAuthEvent('logout', 'manual', this.authState.user?.id);
      await supabaseClient.auth.signOut();
      
      this.updateAuthState({
        user: null,
        session: null,
        organization: null,
        permissions: null,
        loading: false
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  }

  public async refreshSession(): Promise<{ success: boolean }> {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession();
      
      if (error) {
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  // Password Management
  public async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Password reset failed' };
    }
  }

  public async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await this.trackAuthEvent('password_change', 'manual', this.authState.user?.id);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Password update failed' };
    }
  }

  // Organization Management
  public async createOrganization(orgData: any): Promise<{ success: boolean; error?: string; organization?: any }> {
    try {
      const { data: org, error: orgError } = await supabaseClient
        .from('organizations')
        .insert({
          name: orgData.name,
          tier: orgData.tier || 'free',
          settings: orgData.settings || {}
        })
        .select()
        .single();

      if (orgError) {
        return { success: false, error: orgError.message };
      }

      // Add user as admin
      const { error: memberError } = await supabaseClient
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: this.authState.user?.id,
          role: 'admin'
        });

      if (memberError) {
        return { success: false, error: memberError.message };
      }

      await this.loadUserProfile(this.authState.user!);
      
      return { success: true, organization: org };
    } catch (error) {
      return { success: false, error: 'Organization creation failed' };
    }
  }

  public async inviteUser(email: string, role: string = 'member'): Promise<{ success: boolean; error?: string }> {
    if (!this.authState.permissions?.canInviteUsers) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const { error } = await supabaseClient
        .from('organization_invites')
        .insert({
          organization_id: this.authState.organization?.id,
          email,
          role,
          invited_by: this.authState.user?.id
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Send invitation email (in real implementation)
      // await this.sendInvitationEmail(email, role);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'User invitation failed' };
    }
  }

  // Profile Management
  private async createUserProfile(user: User, userData?: any): Promise<void> {
    try {
      await supabaseClient
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: userData?.full_name,
          avatar_url: userData?.avatar_url,
          department: userData?.department,
          role: userData?.role,
          timezone: userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    } catch (error) {
      console.error('[Auth] Profile creation error:', error);
    }
  }

  public async updateProfile(updates: Partial<EnterpriseUser['profile']>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseClient
        .from('user_profiles')
        .update(updates)
        .eq('id', this.authState.user?.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh user data
      await this.loadUserProfile(this.authState.user!);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Profile update failed' };
    }
  }

  // Analytics & Tracking
  private async trackAuthEvent(event: string, provider: string, userId?: string): Promise<void> {
    try {
      await supabaseClient
        .from('auth_events')
        .insert({
          event,
          provider,
          user_id: userId,
          metadata: {
            timestamp: new Date().toISOString(),
            ip_address: 'hidden', // Would get real IP in production
            user_agent: navigator.userAgent
          }
        });
    } catch (error) {
      console.error('[Auth] Event tracking error:', error);
    }
  }

  // Security Features
  public async checkSuspiciousActivity(): Promise<{ suspicious: boolean; reasons?: string[] }> {
    try {
      const { data: recentLogins } = await supabaseClient
        .from('auth_events')
        .select('*')
        .eq('user_id', this.authState.user?.id)
        .eq('event', 'login')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const reasons: string[] = [];
      
      if (recentLogins && recentLogins.length > 10) {
        reasons.push('Multiple login attempts');
      }

      // Check for unusual locations (would implement with real geolocation)
      // Check for unusual devices (would implement with device fingerprinting)
      
      return { suspicious: reasons.length > 0, reasons };
    } catch (error) {
      return { suspicious: false };
    }
  }

  // State Management
  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Getters
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public getUser(): EnterpriseUser | null {
    return this.authState.user;
  }

  public getOrganization(): any {
    return this.authState.organization;
  }

  public getPermissions(): any {
    return this.authState.permissions;
  }

  public isAuthenticated(): boolean {
    return !!this.authState.user && !!this.authState.session;
  }

  public isLoading(): boolean {
    return this.authState.loading;
  }

  // SSO Providers Configuration
  public getAvailableProviders(): SSOProvider[] {
    return [
      {
        id: 'google',
        name: 'Google Workspace',
        icon: '🔍',
        enabled: true
      },
      {
        id: 'microsoft',
        name: 'Microsoft 365',
        icon: '📘',
        enabled: true
      },
      {
        id: 'github',
        name: 'GitHub',
        icon: '🐙',
        enabled: true
      },
      {
        id: 'slack',
        name: 'Slack',
        icon: '💬',
        enabled: true
      }
    ];
  }
}

export const enterpriseAuthService = EnterpriseAuthService.getInstance();
export default EnterpriseAuthService; 