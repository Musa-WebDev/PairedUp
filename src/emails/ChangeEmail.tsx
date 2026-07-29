import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Tailwind, Button } from '@react-email/components';

interface ChangeEmailProps {
  actionUrl: string;
}

export default function ChangeEmail({ 
  actionUrl = "https://pairedup.co.za/auth/change-email" 
}: ChangeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your new email address</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4">
            <Section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <Heading className="text-2xl font-bold text-gray-900 mb-4">
                Confirm Email Change
              </Heading>
              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                You've requested to change the email address associated with your Paired Up account. Please confirm this change by clicking the button below:
              </Text>
              <Button
                href={actionUrl}
                className="bg-black text-white px-6 py-3 rounded-md font-medium"
              >
                Confirm New Email
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
