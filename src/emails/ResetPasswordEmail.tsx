import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Tailwind, Button } from '@react-email/components';

interface ResetPasswordEmailProps {
  actionUrl: string;
}

export default function ResetPasswordEmail({ 
  actionUrl = "https://pairedup.co.za/auth/reset" 
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Paired Up password</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4">
            <Section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <Heading className="text-2xl font-bold text-gray-900 mb-4">
                Reset Password
              </Heading>
              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                Someone recently requested a password change for your Paired Up account. If this was you, you can set a new password here:
              </Text>
              <Button
                href={actionUrl}
                className="bg-black text-white px-6 py-3 rounded-md font-medium"
              >
                Reset Password
              </Button>
              <Text className="text-gray-400 text-sm mt-8">
                If you didn't request this, you can safely ignore this email. Your password won't be changed until you access the link above and create a new one.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
