import { Card } from '@/components/ui/Card';

const APP_URL = 'https://polycentric-xdweb.vercel.app/';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-space-grotesk font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      {children}
    </section>
  );
}

function NumberedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal list-outside ml-5 space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ol>
  );
}

export default function FacilitationGuidePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-8">
      <header className="space-y-3">
        <h1 className="font-space-grotesk font-bold text-3xl md:text-4xl text-gray-900 dark:text-gray-100">
          Facilitation Guide
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          App link:{' '}
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            {APP_URL}
          </a>
        </p>
      </header>

      <Card className="space-y-10">
        <Section title="Facilitation before the play time">
          <NumberedList
            items={[
              'Create your game (all other games have been cleared)',
              "Distribute the app before play time so people can sign in, get familiar with the gameplay and scenario, join the game, and choose a role. Encourage them to choose a role that doesn't fit their actual persona, but let them know it's ok if they prefer to play a role they're more familiar with.",
              'Sign in uses email and a magic link to sign in.',
            ]}
          />
        </Section>

        <Section title="Signing in and choosing a role">
          <NumberedList
            items={[
              "Sign in with email address. Click the 'Sign in' link in the email you should've received.",
              <>Once signed in, click &apos;Join Game&apos; on the homepage.</>,
              "You should be directed to select a role. Read through the roles and choose one that doesn't fit you perfectly, but that you feel like you could reasonably roleplay as.",
            ]}
          />
        </Section>

        <Section title="Facilitation: During the play time">
          <NumberedList
            items={[
              'Check in and verify everyone is in the game and has a role',
              'Lay out the scenario for them. Can read from the scenario, or frame it however you\'d like such as "We\'ll be making agreements together to form a network of agreements that would create a robust and durable DWeb (nomad web)"',
              'Ensure they focus on first meeting each other, getting acquainted with roles, and then making agreements with each other. The app is only meant as a companion to log agreements once made IRL. Minimum time should be spent in-app during gameplay, maximum time playing the game. We can all look more into the app and the network of agreements after the game play is finished.',
            ]}
          />
        </Section>

        <Section title="Gameplay instructions">
          <NumberedList
            items={[
              'Get familiar with your role, and talk to others to get familiar with their roles.',
              'When common needs are found, propose an agreement in conversation.',
              'You can make simple agreements between two players, or complex ones that include any number of other players.',
              <>When a verbal agreement is reached, have one member of the agreement &apos;Propose Agreement&apos; in the app.</>,
              <>Then have the other players &apos;Approve&apos; the agreement in the app.</>,
              'Repeat, making as many agreements as you can during the time allowed for gameplay.',
              'Now play!',
            ]}
          />
        </Section>

        <Section title="Proposing an agreement">
          <NumberedList
            items={[
              <>In the app, and within the game you&apos;re playing, go to &apos;Network&apos; view (the default) and click &apos;Propose Agreement&apos;</>,
              'Check any and all members of the Agreement',
              'Fill in what each member is offering to the Agreement',
              "Give a simple description of the combined effect of the offerings within an Agreement, such as 'a well-resourced open source privacy protocol' or 'formed a new foundation to fund research' or 'a consortium to spread awareness'",
              <>Click &apos;Propose&apos;</>,
              <>Other players can find the Agreement in the app under the &apos;Agreements&apos; page within the game. From there, they can &apos;Approve&apos; or &apos;Revise&apos; the Agreement.</>,
            ]}
          />
        </Section>

        <Section title="Facilitation: Post-Game">
          <NumberedList
            items={[
              'Show the network view on a screen if you can. NBD as everyone should have access to the network view on their device.',
              <>
                Ask for players to share:
                <ol className="list-decimal list-outside ml-5 mt-3 space-y-2">
                  <li>Would anyone like to share any interesting agreements that you were a part of?</li>
                  <li>Learn anything interesting about the role you were playing?</li>
                  <li>
                    Learn anything interesting about making agreements with certain roles? (harder or
                    easier than expected?)
                  </li>
                  <li>
                    Any learnings from the playing the game that you feel could be taken and applied to
                    the real world problem of building out a durable and resilient DWeb?
                  </li>
                  <li>
                    Any insights on the aggregate? Such as noticing many similar types of agreements
                    (scale/purpose/etc)
                  </li>
                </ol>
              </>,
            ]}
          />
        </Section>
      </Card>
    </div>
  );
}
