/**
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

/**
 * External dependencies
 */
import React from 'react'; // Exception: Must use react here instead of wordpress/element for internal API use.

// Grab React's internal dispatcher symbol
const REACT_CURRENT_DISPATCHER =
	React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
		.ReactCurrentDispatcher;

/**
 * Wraps the given render function to fail if any React hook is used.
 *
 * @since n.e.x.t
 *
 * @param {Function} renderFn Function which renders one or more components.
 * @return {Function} Wrapped function.
 */
export function withNoHooksAllowed( renderFn ) {
	return ( ...args ) => {
		const original = REACT_CURRENT_DISPATCHER.current;

		REACT_CURRENT_DISPATCHER.current = new Proxy(
			{},
			{
				get: ( _, prop ) => {
					if (
						typeof prop === 'string' &&
						prop.startsWith( 'use' )
					) {
						throw new Error(
							`Hook "${ prop }" is not allowed in this context`
						);
					}
					return () => {
						throw new Error(
							`Invalid hook call: ${ String( prop ) }`
						);
					};
				},
			}
		);

		try {
			return renderFn( ...args );
		} finally {
			REACT_CURRENT_DISPATCHER.current = original;
		}
	};
}
