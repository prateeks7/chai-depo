import { useMotionMode } from '../../lib/useMotionMode';
import { PourStack } from './PourStack';
import { PourStage } from './PourStage';

/** Hero + flavours. Pinned scene on roomy screens with motion allowed; stacked otherwise. */
export function PourSequence() {
  const mode = useMotionMode();
  return mode === 'full' ? <PourStage /> : <PourStack />;
}
