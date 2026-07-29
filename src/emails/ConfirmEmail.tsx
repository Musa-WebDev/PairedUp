import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Tailwind, Button } from '@react-email/components';

interface ConfirmEmailProps {
  actionUrl: string;
  userName?: string;
}

export default function ConfirmEmail({ 
  actionUrl = "https://pairedup.co.za/auth/confirm", 
  userName = "there" 
}: ConfirmEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email address for Paired Up</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4">
            <Section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <Heading className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Paired Up! 🎉
              </Heading>
              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                Hi {userName}, we're excited to have you on board. Please confirm your email address to get started with planning your movies and activities with your partner.
              </Text>
              <Button
                href={actionUrl}
                className="bg-black text-white px-6 py-3 rounded-md font-medium"
              >
                Confirm Email Address
              </Button>
              <Text className="text-gray-400 text-sm mt-8">
                If you didn't create an account, you can safely ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
