import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  reactComponent?: React.ReactElement;
  html?: string;
}

export async function sendEmail({ to, subject, reactComponent, html: rawHtml }: SendEmailParams) {
  try {
    // Determine the HTML content: either render the React component or use the raw HTML string
    const html = reactComponent ? await render(reactComponent) : rawHtml;

    if (!html) throw new Error('Either reactComponent or html must be provided');

    const response = await resend.emails.send({
      from: 'onboarding@resend.dev', // Default testing email from Resend. Change this once you add a custom domain.
      to,
      subject,
      html,
    });
    
    if (response.error) {
      console.error('Resend API error:', response.error);
      return { success: false, error: response.error };
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
