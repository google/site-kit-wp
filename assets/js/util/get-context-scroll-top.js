/**
 * Utility function getContextScrollTop.
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
 * Gets the y coordinate to scroll to the top of a context element, taking the sticky admin bar, header and navigation height into account.
 *
 * @since n.e.x.t
 *
 * @param {string} contextID  The ID of the context element to scroll to.
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The offset to scroll to.
 */
const getContextScrollTop = ( contextID, breakpoint ) => {
	const contextElement = document.getElementById( contextID );
	if ( ! contextElement ) {
		return 0;
	}

	const contextTop = contextElement.getBoundingClientRect().top;

	const header = document.querySelector( '.googlesitekit-header' );

	const hasStickyAdminBar = breakpoint !== 'small';

	const headerHeight = hasStickyAdminBar
		? header.getBoundingClientRect().bottom
		: header.offsetHeight;

	/**
	 * Check whether the unified dashboard navigation
	 * is available. If it's available set the offsetHeight.
	 * Otherwise set a margin bottom (80) for the PSI header
	 * title to be visible on scroll.
	 */
	const hasNavigation = document.querySelector( '.googlesitekit-navigation' );
	const navigationHeight = hasNavigation ? hasNavigation.offsetHeight : 80;

	return contextTop + global.scrollY - headerHeight - navigationHeight;
};

export default getContextScrollTop;
