import { trackEvent } from '@/js/util';

export function trackBlockUsage(
	blockName,
	action,
	label = null,
	trackGAEvent = trackEvent
) {
	trackGAEvent( blockName, action, label );
}
