/**
 * API function to create fetch store.
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
import invariant from 'invariant';
import md5 from 'md5';

const RECEIVE_ERROR = 'RECEIVE_ERROR';
const CLEAR_ERROR = 'CLEAR_ERROR';
const CLEAR_ERRORS = 'CLEAR_ERRORS';

/**
 * Internal dependencies
 */
import { stringifyObject } from '../../util';

export function generateErrorKey( baseName, args ) {
	if ( args && Array.isArray( args ) ) {
		const stringifiedArgs = args.map( ( item ) => {
			return 'object' === typeof item ? stringifyObject( item ) : item;
		} );
		return `${ baseName }::${ md5( JSON.stringify( stringifiedArgs ) ) }`;
	}

	return baseName;
}

export const actions = {
	receiveError( error, baseName, args ) {
		invariant( error, 'error is required.' );

		return {
			type: RECEIVE_ERROR,
			payload: {
				error,
				baseName,
				args,
			},
		};
	},
	clearError( baseName, args ) {
		return {
			type: CLEAR_ERROR,
			payload: {
				baseName,
				args,
			},
		};
	},
	clearErrors( baseName ) {
		return {
			type: CLEAR_ERRORS,
			payload: {
				baseName,
			},
		};
	},
};

export function createErrorStore() {
	const initialState = {
		errors: {},
		error: undefined,
	};

	function reducer( state, { type, payload } ) {
		switch ( type ) {
			case RECEIVE_ERROR: {
				const { baseName, args, error } = payload;

				if ( baseName ) {
					return {
						...state,
						errors: {
							...( state.errors || {} ),
							[ generateErrorKey( baseName, args ) ]: error,
						},
					};
				}

				// @TODO: remove once all instances of the legacy behavior have been removed.
				return { ...state, error };
			}

			case CLEAR_ERROR: {
				const { baseName, args } = payload;
				const newState = { ...state };
				if ( baseName ) {
					const key = generateErrorKey( baseName, args );
					newState.errors = { ...( state.errors || {} ) };
					delete newState.errors[ key ];
				} else {
					// @TODO: remove it once all instances of the legacy behavior have been removed.
					newState.error = undefined;
				}

				return newState;
			}

			case CLEAR_ERRORS: {
				const { baseName } = payload;
				const newState = { ...state };
				if ( baseName ) {
					newState.errors = { ...( state.errors || {} ) };
					for ( const key in newState.errors ) {
						if ( key === baseName || key.startsWith( `${ baseName }::` ) ) {
							delete newState.errors[ key ];
						}
					}
				} else {
					newState.errors = {};
					// @TODO: remove it once all instances of the legacy behavior have been removed.
					newState.error = undefined;
				}
				return newState;
			}

			default: {
				return state;
			}
		}
	}

	const controls = {};

	const resolvers = {};

	const selectors = {
		/**
		 * Retrieves the error object from state.
		 *
		 * Error object has the format:
		 *
		 * ```
		 * {
		 *   code: <String>,
		 *   message: <String>,
		 *   data: <Object>
		 * }
		 * ```
		 *
		 * @since 1.15.0
		 *
		 * @param {Object}      state        Data store's state.
		 * @param {string}      selectorName Selector name.
		 * @param {Array.<any>} [args]       Arguments passed to selector (default `[]`).
		 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
		 */
		getErrorForSelector( state, selectorName, args = [] ) {
			invariant( selectorName, 'selectorName is required.' );
			return selectors.getError( state, selectorName, args );
		},

		/**
		 * Retrieves the error object from state.
		 *
		 *```
		 * {
		 *   code: <String>,
		 *   message: <String>,
		 *   data: <Object>
		 * }
		 * ```
		 *
		 * @since 1.15.0
		 *
		 * @param {Object}      state      Data store's state.
		 * @param {string}      actionName Action name.
		 * @param {Array.<any>} [args]     Arguments passed to action (default `[]`).
		 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
		 */
		getErrorForAction( state, actionName, args = [] ) {
			invariant( actionName, 'actionName is required.' );
			return selectors.getError( state, actionName, args );
		},

		/**
		 * Retrieves the error object from state.
		 *
		 *```
		 * {
		 *   code: <String>,
		 *   message: <String>,
		 *   data: <Object>
		 * }
		 * ```
		 *
		 * @since 1.15.0
		 * @private
		 *
		 * @param {Object}      state      Data store's state.
		 * @param {string}      [baseName] Selector or action name.
		 * @param {Array.<any>} [args]     Arguments array.
		 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
		 */
		getError( state, baseName, args ) {
			const { error, errors } = state;

			// @TODO: remove it once all instances of the legacy usage have been removed. Also make baseName required then.
			if ( ! baseName && ! args ) {
				return error;
			}

			invariant( baseName, 'baseName is required.' );

			return errors[ generateErrorKey( baseName, args ) ];
		},

		/**
		 * Gets a list of all unique errors.
		 *
		 * @since 1.19.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {Object[]} Unique set of errors.
		 */
		getErrors( state ) {
			const errorsSet = new Set( Object.values( state.errors ) );

			// @TODO: remove it once all instances of the legacy usage have been removed.
			if ( undefined !== state.error ) {
				errorsSet.add( state.error );
			}

			return Array.from( errorsSet );
		},

		/**
		 * Determines whether the datastore has errors or not.
		 *
		 * @since 1.15.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean} TRUE if the datastore has errors, otherwise FALSE.
		 */
		hasErrors( state ) {
			return selectors.getErrors( state ).length > 0;
		},
	};

	return {
		initialState,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
}
