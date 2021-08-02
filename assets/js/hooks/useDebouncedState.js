/**
 * `useDebouncedState` hook.
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
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Debounces a value after the specified delay.
 *
 * @since 1.16.0
 *
 * @param {string} value The value to be debounced.
 * @param {number} delay Number of milliseconds to debounce.
 * @return {string} The update value after the delay.
 */
export function useDebouncedState( value, delay ) {
	const [ debouncedValue, setDebouncedValue ] = useState( value );

	useEffect( () => {
		// Update debounced value after the delay
		const timeout = setTimeout( () => {
			setDebouncedValue( value );
		}, delay );

		return () => {
			clearTimeout( timeout );
		};
	}, [ value, delay ] );

	return debouncedValue;
}
