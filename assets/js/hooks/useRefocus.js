/**
 * `useRefocus` hook.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Invokes a function when the window is blurred and then refocused after the specified delay.
 *
 * @since 1.80.0
 *
 * @param {Function} callback     Function to invoke when the window is blurred and then refocused after the specified delay.
 * @param {number}   milliseconds Amount of time (in milliseconds) required to elapse with the tab unfocused before the callback should be run when refocused. Default is `0`, eg. run the `callback` after returning to this tab/window as soon as the user is unfocused for any length of time.
 */
export function useRefocus( callback, milliseconds = 0 ) {
	// Run the supplied callback whenever a user re-focuses window, as
	// long as it happens after the specified delay.
	useEffect( () => {
		let timeout;
		let runCallback = false;

		// Count `milliseconds` once user focuses elsewhere.
		const countIdleTime = () => {
			timeout = global.setTimeout( () => {
				runCallback = true;
			}, milliseconds );
		};

		// Run the callback when user re-focuses after `milliseconds` or more.
		const onFocus = () => {
			global.clearTimeout( timeout );

			// Do not run the callback if user has been away for less
			// than `milliseconds`.
			if ( ! runCallback ) {
				return;
			}
			runCallback = false;

			callback();
		};

		global.addEventListener( 'focus', onFocus );
		global.addEventListener( 'blur', countIdleTime );

		return () => {
			global.removeEventListener( 'focus', onFocus );
			global.removeEventListener( 'blur', countIdleTime );
			global.clearTimeout( timeout );
		};
	}, [ milliseconds, callback ] );
}
