import { Intro } from './components/Intro';
import { MobileCtaBar } from './components/MobileCtaBar';
import { Ticker } from './components/Ticker';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { DemoIntentProvider } from './lib/DemoIntentContext';
import { useSmoothScroll } from './lib/scroll';
import { DemoRequest } from './sections/DemoRequest/DemoRequest';
import { HowItWorks } from './sections/HowItWorks/HowItWorks';
import { Lineup } from './sections/Lineup/Lineup';
import { PourSequence } from './sections/PourSequence/PourSequence';
import { WherePours } from './sections/WherePours/WherePours';
import { FLAVOURS } from './content/flavours';

const TICKER = FLAVOURS.map((f) => f.variant ?? f.name);

export default function App() {
  useSmoothScroll();
  return (
    <DemoIntentProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Intro />
      <SiteHeader />
      <main id="main">
        <PourSequence />
        <Ticker items={TICKER} />
        <Lineup />
        <HowItWorks />
        <WherePours />
        <DemoRequest />
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </DemoIntentProvider>
  );
}
