/**
 * `useDebounce` hook, from @wordpress/compose.
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

// @TODO When we upgrade React to 16.4, we can also upgrade @wordpress/compose, and then this file can be removed.

/**
 * External dependencies
 */
import { useMemoOne } from 'use-memo-one';
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Debounces a function with Lodash's `debounce`.
 *
 * A new debounced function will be returned and any scheduled calls
 * cancelled if any of the arguments change, including the function to debounce,
 * so please wrap functions created on render in components in `useCallback`.
 *
 * @since 1.26.0
 *
 * @param {...any} args Arguments passed to Lodash's `debounce`.
 * @return {Function} Debounced function.
 */
export function useDebounce( ...args ) {
	const debounced = useMemoOne( () => debounce( ...args ), args );
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
