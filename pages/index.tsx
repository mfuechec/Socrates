import Head from 'next/head';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <>
      <Head>
        <title>Socrates - AI Math Tutor</title>
        <meta
          name="description"
          content="AI-powered math tutoring using the Socratic method"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <ChatInterface />
    </>
  );
}
