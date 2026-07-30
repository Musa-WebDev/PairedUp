import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';

interface SendEmailParams {
  to: string;
  subject: string;
  reactComponent?: React.ReactElement;
  html?: string;
}

export async function sendEmail({ to, subject, reactComponent, html: rawHtml }: SendEmailParams) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Email is not configured. Add RESEND_API_KEY to the deployment environment.');
    }

    // Server actions can be imported while Next.js collects route data at build time.
    // Initialize Resend only when an email is actually being sent.
    const resend = new Resend(apiKey);

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
