/**
 * `useBreakpoint` hook.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

import { useWindowWidth } from './useWindowSize';

/**
 * Breakpoint for an extra large screen (over `1280px` wide).
 */
export const BREAKPOINT_XLARGE = 'xlarge';
/**
 * Breakpoint for a desktop screen (over `960px` wide).
 */
export const BREAKPOINT_DESKTOP = 'desktop';
/**
 * Breakpoint for a tablet screen (over `600px` wide).
 */
export const BREAKPOINT_TABLET = 'tablet';
/**
 * Breakpoint for a mobile phone screen (any screen `600px` wide or less).
 */
export const BREAKPOINT_SMALL = 'small';

/**
 * Retrieves the current breakpoint.
 *
 * @since 1.29.0
 *
 * @return {string} The current breakpoint according to the window size.
 */
export function useBreakpoint() {
	const windowWidth = useWindowWidth();

	if ( windowWidth > 1280 ) {
		return BREAKPOINT_XLARGE;
	}

	if ( windowWidth > 960 ) {
		return BREAKPOINT_DESKTOP;
	}

	if ( windowWidth > 600 ) {
		return BREAKPOINT_TABLET;
	}

	return BREAKPOINT_SMALL;
}
