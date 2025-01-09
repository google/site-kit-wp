import { useThrottle } from '@react-hook/throttle';
import useEvent from '@react-hook/event';

const emptyObj = {};

const win = typeof global === 'undefined' ? null : global;
const getSize = () => [
	// document.documentElement.clientWidth,
	// document.documentElement.clientHeight,
	global.innerWidth,
	global.innerHeight,
];

export const useWindowSize = ( options = emptyObj ) => {
	const { fps, leading, initialWidth = 0, initialHeight = 0 } = options;
	const [ size, setThrottledSize ] = useThrottle(
		/* istanbul ignore next */
		typeof document === 'undefined'
			? [ initialWidth, initialHeight ]
			: getSize,
		fps,
		leading
	);
	const setSize = () => setThrottledSize( getSize );

	useEvent( win, 'resize', setSize );
	useEvent( win, 'orientationchange', setSize );

	return size;
};

export const useWindowHeight = ( options ) => useWindowSize( options )[ 1 ];

export const useWindowWidth = ( options ) => useWindowSize( options )[ 0 ];
