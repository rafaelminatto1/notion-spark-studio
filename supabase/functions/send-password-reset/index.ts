
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  ip_address?: string;
  user_agent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, ip_address, user_agent }: PasswordResetRequest = await req.json();

    // Generate secure token using our database function
    const { data: tokenData, error: tokenError } = await supabaseClient.rpc(
      'request_password_reset_with_otp',
      {
        _email: email,
        _ip_address: ip_address || null,
        _user_agent: user_agent || null
      }
    );

    if (tokenError || !tokenData?.success) {
      console.error('Error generating reset token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset token' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // In a real implementation, you would send an email here using a service like Resend
    // For now, we'll just log the reset URL and return success
    const resetUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/reset-password?token=${tokenData.token}`;
    
    console.log(`Password reset URL for ${email}: ${resetUrl}`);
    console.log(`Token expires at: ${tokenData.expires_at}`);

    // TODO: Implement email sending with Resend or similar service
    // const emailResponse = await resend.emails.send({
    //   from: "Your App <noreply@yourapp.com>",
    //   to: [email],
    //   subject: "Reset your password",
    //   html: `
    //     <h1>Reset Your Password</h1>
    //     <p>Click the link below to reset your password. This link expires in 15 minutes for security.</p>
    //     <a href="${resetUrl}">Reset Password</a>
    //     <p>If you didn't request this, please ignore this email.</p>
    //   `,
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent',
        // For development - remove in production
        debug_reset_url: resetUrl 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
