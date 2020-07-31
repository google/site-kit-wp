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

/**
 * Internal dependencies
 */
import { stringifyObject } from '../../util';

const RECEIVE_ERROR = 'RECEIVE_ERROR';
const CLEAR_ERROR = 'CLEAR_ERROR';

function generateErrorKey( baseName, args ) {
	let key = baseName;
	if ( args ) {
		key += stringifyObject( args );
	}

	return key;
}

function reducer( state, { type, payload } ) {
	switch ( type ) {
		case RECEIVE_ERROR: {
			const { baseName, args, error } = payload;
			const newState = { ...state };

			if ( baseName ) {
				newState.errors = {
					...( state.errors || {} ),
					[ generateErrorKey( baseName, args ) ]: error,
				};
			} else {
				newState.error = error;
			}

			return newState;
		}

		case CLEAR_ERROR: {
			const { baseName, args } = payload;
			const key = generateErrorKey( baseName, args );

			return {
				...state,
				errors: Object
					.keys( state.errors )
					.filter( ( errorKey ) => errorKey !== key )
					.reduce( ( errors, errorKey ) => ( { ...errors, [ errorKey ]: state.errors[ errorKey ] } ), {} ),
			};
		}

		default: {
			return { ...state };
		}
	}
}

export function createErrorStore() {
	const INITIAL_STATE = {
		errors: {},
		error: undefined,
	};

	const actions = {
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
	};

	const controls = {};

	const resolvers = {};

	const selectors = {
		getErrorForSelector( state, selectorName, args ) {
			invariant( selectorName, 'selectorName is required.' );
			return selectors.getError( state, selectorName, args );
		},

		getErrorForAction( state, actionName, args ) {
			invariant( actionName, 'actionName is required.' );
			return selectors.getError( state, actionName, args );
		},

		/**
		 * Retrieves the error object from state.
		 *
		 * Returns `undefined` if there is no error set.
		 *```
		 * {
		 *   code: <String>,
		 *   message: <String>,
		 *   data: <Object>
		 * }
		 * ```
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {Object} state Data store's state.
		 * @param {string} [baseName] A selector or action name.
		 * @param {Object} [args] An arguments object.
		 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
		 */
		getError( state, baseName, args ) {
			if ( ! baseName && ! args ) {
				return state.error;
			}

			if ( baseName ) {
				const { errors } = state;

				return errors[ generateErrorKey( baseName, args ) ];
			}

			return undefined;
		},
	};

	return {
		INITIAL_STATE,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
}
