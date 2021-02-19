/**
 * Breakpoint utility function.
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
 * Returns the current breakpoint.
 *
 * @since n.e.x.t
 *
 * @return {string} The breakpoint, either small, tablet, desktop or large.
 */
export function getBreakpoint() {
	if ( global.window.matchMedia( '(min-width: 1280px)' ).matches ) {
		return 'xlarge';
	}

	if ( global.window.matchMedia( '(min-width: 960px)' ).matches ) {
		return 'desktop';
	}

	if ( global.window.matchMedia( '(min-width: 600px)' ).matches ) {
		return 'tablet';
	}

	if ( global.window.matchMedia( '(max-width: 599px)' ).matches ) {
		return 'small';
	}
}

export default getBreakpoint;
