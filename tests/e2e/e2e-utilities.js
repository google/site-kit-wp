/**
 * E2E Utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { applyMiddleware } from 'redux';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

if ( global._e2eApiFetch === undefined ) {
	global._e2eApiFetch = apiFetch;
}

/**
 * Creates a middleware for logging dispatched actions to the console.
 *
 * @return {Function} Middleware function.
 */
function createLoggerMiddleware() {
	return ( next ) => ( action ) => {
		const { type, ..._action } = action;

		// Objects must be stringified to be inspectable from the console during E2E tests.
		// Not all structures can be stringified so errors must be caught.
		try {
			global.console.debug( 'DISPATCH', type, JSON.stringify( _action ) );
		} catch ( e ) {
			global.console.debug( 'DISPATCH', type, 'JSON ERROR' );
		}

		return next( action );
	};
}

/**
 * Redux DevTools logger implementation.
 *
 * We set this because wp.data registry middleware is not extendable,
 * but it has built-in support for the devtools extension.
 * Since extensions can't be used in an E2E context, we're safe to hijack the global here.
 *
 * @see {@link https://github.com/WordPress/gutenberg/blob/2611a1df0a423dd22cbbabef8f2e87eb91b54bb2/packages/data/src/namespace-store/index.js#L124-L147}
 * @return {Object} Redux logger enhancer.
 */
global.__REDUX_DEVTOOLS_EXTENSION__ = () => {
	return applyMiddleware( createLoggerMiddleware );
};
