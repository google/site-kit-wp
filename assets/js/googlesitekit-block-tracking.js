import { watchBlocks } from './googlesitekit/block-tracking/watch-blocks';

const blocksToTrack = [
	'google-site-kit/rrm-subscribe-with-google',
	'google-site-kit/rrm-contribute-with-google',
];

watchBlocks( blocksToTrack );
