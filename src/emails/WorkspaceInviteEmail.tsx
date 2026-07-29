import * as React from 'react';
import { Html, Body, Head, Heading, Container, Preview, Section, Text, Tailwind, Button } from '@react-email/components';

interface WorkspaceInviteEmailProps {
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
}

export default function WorkspaceInviteEmail({ 
  inviterName = "Someone", 
  workspaceName = "a workspace",
  inviteLink = "https://pairedup.co.za"
}: WorkspaceInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} invited you to join a workspace</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4">
            <Section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <Heading className="text-2xl font-bold text-gray-900 mb-4">
                You've been invited! 🎉
              </Heading>
              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                <strong>{inviterName}</strong> has invited you to collaborate in the <strong>{workspaceName}</strong> workspace on Paired Up. 
              </Text>
              <Button
                href={inviteLink}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium"
              >
                Accept Invitation
              </Button>
              <Text className="text-gray-400 text-sm mt-8">
                If you don't know who this is, you can safely ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
