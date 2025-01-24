/**
 * `useWindowSize` hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Copied from https://github.com/jaredLunde/react-hook/blob/b8ac9515e26937e838a36a27001dc46c7f46a390/packages/window-size/throttled/src/index.tsx
// Modified to use global.innerWidth and global.innerHeight instead of document.documentElement.clientWidth and document.documentElement.clientHeight.
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
