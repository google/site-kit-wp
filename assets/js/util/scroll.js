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
 * Gets the y coordinate to scroll to the top of a context element, taking the sticky admin bar, header and navigation height into account.
 *
 * @since 1.48.0
 *
 * @param {string} context    The id (prepend #) or class (prepend .) of the context element to scroll to.
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The offset to scroll to.
 */
export function getContextScrollTop( context, breakpoint ) {
	const contextElement = document.querySelector( context );
	if ( ! contextElement ) {
		return 0;
	}

	const contextTop = contextElement.getBoundingClientRect().top;

	const header = document.querySelector( '.googlesitekit-header' );

	const hasStickyAdminBar = breakpoint !== 'small';

	const headerHeight = hasStickyAdminBar
		? header.getBoundingClientRect().bottom
		: header.offsetHeight;

	const navigationHeight = Array.from(
		document.querySelectorAll(
			'.googlesitekit-navigation, .googlesitekit-entity-header'
		)
	).reduce( ( navHeight, el ) => navHeight + el.offsetHeight, 0 );

	/*
	 * The old PSI dashboard widget anchor points to the widget box and not the
	 * header of the widget which is 80px higher.
	 *
	 * @TODO Remove this when the unified dashboard is published and the
	 * `unifiedDashboard` feature flag is removed as the new widget uses the new
	 * #speed anchor.
	 */
	const anchorAdjustment =
		context === '#googlesitekit-pagespeed-header' ? 80 : 0;

	return (
		contextTop +
		global.scrollY -
		headerHeight -
		navigationHeight -
		anchorAdjustment
	);
}
