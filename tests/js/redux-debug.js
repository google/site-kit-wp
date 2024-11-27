/**
 * Redux Debugging utilties.
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
 * External dependencies
 */
import { applyMiddleware } from 'redux';

/**
 * Creates a middleware for logging dispatched actions to the console.
 *
 * @since 1.11.0
 * @since n.e.x.t Added support for store name.
 *
 * @param {Option}   args          Arguments.
 * @param {Function} args.dispatch Function to dispatch an action on the store.
 * @param {Function} args.getState Function to retrieve the current store state.
 * @param {string}   args.name     Store name / reducer key.
 * @return {Function} Middleware function.
 */
function createLoggerMiddleware( { name } ) {
	return ( next ) => ( action ) => {
		const { type, ..._action } = action;

		// Objects must be stringified to be inspectable from the console during E2E tests.
		// Not all structures can be stringified so errors must be caught.
		try {
			global.console.debug(
				'DISPATCH',
				name,
				type,
				':::',
				JSON.stringify( _action )
			);
		} catch ( e ) {
			global.console.debug( 'DISPATCH', name, type, 'JSON ERROR' );
		}

		return next( action );
	};
}

/**
 * Adds a Redux DevTools logger implementation.
 *
 * We set this because wp.data registry middleware is not extendable,
 * but it has built-in support for the devtools extension.
 * Since the real extension can't be used in a unit or E2E testing context, we're safe to hijack the global here.
 *
 * @since 1.11.0
 * @see {@link https://github.com/WordPress/gutenberg/blob/2611a1df0a423dd22cbbabef8f2e87eb91b54bb2/packages/data/src/namespace-store/index.js#L124-L147}
 */
export function setupReduxLogger() {
	setupReduxWithMiddleware( createLoggerMiddleware );
}

/**
 * Sets up Redux with additional middlewares applied.
 * Must be called before stores are created.
 *
 * @since n.e.x.t
 *
 * @param {...Function} middlewares Middleware functions to apply.
 */
export function setupReduxWithMiddleware( ...middlewares ) {
	global.__REDUX_DEVTOOLS_EXTENSION__ = ( { name } ) => {
		const nameAwareMiddlewares = middlewares.map(
			( middleware ) => ( middlewareAPI ) =>
				middleware( { ...middlewareAPI, name } )
		);
		return applyMiddleware( ...nameAwareMiddlewares );
	};
}
