/**
 * `useThrottle` hook, from @wordpress/compose.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * External dependencies
 */
import { useMemoOne } from 'use-memo-one';
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Throttles a function similar to Lodash's `throttle`. A new throttled function will
 * be returned and any scheduled calls cancelled if any of the arguments change,
 * including the function to throttle, so please wrap functions created on
 * render in components in `useCallback`.
 *
 * @since 1.102.0
 *
 * @param {...any} args Arguments passed to Lodash's `throttle`.
 * @return {Function} Throttled function.
 */
export default function useThrottle( ...args ) {
	const throttled = useMemoOne( () => throttle( ...args ), args );
	useEffect( () => () => throttled.cancel(), [ throttled ] );
	return throttled;
}
