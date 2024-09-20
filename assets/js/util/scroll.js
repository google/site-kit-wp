/**
 * Utility functions related to window scrolling.
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

/**
 * Internal dependencies
 */
import { BREAKPOINT_SMALL } from '../hooks/useBreakpoint';
import { finiteNumberOrZero } from './finite-number-or-zero';

/**
 * Gets the y coordinate to scroll to the top of a context element, taking the sticky admin bar, header and navigation height into account.
 *
 * @since n.e.x.t Renamed from getContextScrollTop to getNavigationalScrollTop.
 *
 * @param {string} selector   Selector for the element to scroll to. The id (prepend #) or class (prepend .).
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The offset to scroll to.
 */
export function getNavigationalScrollTop( selector, breakpoint ) {
	const contextElement = document.querySelector( selector );
	if ( ! contextElement ) {
		return 0;
	}

	const contextTop = contextElement.getBoundingClientRect().top;
	const headerHeight = getStickyHeaderHeight( breakpoint );

	return contextTop + global.scrollY - headerHeight;
}

/**
 * Gets the height of the sticky header.
 *
 * @since 1.69.0
 * @since 1.98.0 Renamed from `getHeaderHeight()` to `getStickyHeaderHeight()`.
 *
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The height of the sticky header.
 */
export function getStickyHeaderHeight( breakpoint ) {
	let headerHeight = getStickyHeaderHeightWithoutNav( breakpoint );

	const navigation = document.querySelectorAll(
		'.googlesitekit-navigation, .googlesitekit-entity-header'
	);

	headerHeight += Array.from( navigation ).reduce(
		( height, el ) => height + el.offsetHeight,
		0
	);

	return headerHeight;
}

/**
 * Returns the height of the sticky WordPress admin bar, if present.
 *
 * @since 1.98.0
 *
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The height of the sticky WordPress admin bar, if present.
 */
function getWordPressAdminBarHeight( breakpoint ) {
	// WordPress admin bar is only sticky for breakpoints larger than BREAKPOINT_SMALL. If it's also not sticky then we can return a height of 0.
	const wpAdminBar = document.querySelector( '#wpadminbar' );

	if ( wpAdminBar && breakpoint !== BREAKPOINT_SMALL ) {
		return wpAdminBar.offsetHeight;
	}

	return 0;
}

/**
 * Returns the height of the sticky Site Kit header including the sticky WordPress admin bar when it's present.
 *
 * @since 1.98.0
 *
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The height of the sticky Site Kit header including the sticky WordPress admin bar when it's present.
 */
function getGoogleSiteKitHeaderHeight( breakpoint ) {
	// This function calculates the height of the sticky Site Kit header including the sticky WordPress admin bar when it's present.
	const header = document.querySelector( '.googlesitekit-header' );
	if ( header ) {
		// If the breakpoint is BREAKPOINT_SMALL, the WordPress admin bar is not sticky and we can return the height of the Site Kit header alone.
		// Otherwise, we use the value of the bottom of the Site Kit header's bounding box as this will take into account the sticky WordPress admin bar.
		if ( breakpoint === BREAKPOINT_SMALL ) {
			return header.offsetHeight;
		}

		const headerBottom = header.getBoundingClientRect().bottom;
		// In case the header is unexpectedly _not_ sticky and the value for .bottom is negative, we return 0.
		return headerBottom < 0 ? 0 : headerBottom;
	}

	return 0;
}

/**
 * Gets the height of the sticky header without the Site Kit navigation bar.
 *
 * @since 1.95.0
 * @since 1.98.0 Renamed from `getHeaderHeightWithoutNav()` to `getStickyHeaderHeightWithoutNav()`.
 *
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The height of the sticky header without the navigation bar.
 */
export function getStickyHeaderHeightWithoutNav( breakpoint ) {
	let headerHeight = 0;

	const header = document.querySelector( '.googlesitekit-header' );

	const isSiteKitHeaderSticky =
		!! header && global.getComputedStyle( header ).position === 'sticky';

	if ( isSiteKitHeaderSticky ) {
		headerHeight = getGoogleSiteKitHeaderHeight( breakpoint );
	} else {
		// If the Site Kit header is not sticky, we only need to calculate the height of the sticky WordPress admin bar.
		headerHeight = getWordPressAdminBarHeight( breakpoint );
	}

	// Provide a safety net in case something unexpected has happened.
	headerHeight = finiteNumberOrZero( headerHeight );
	return headerHeight < 0 ? 0 : headerHeight;
}
