/**
 * API function to create fetch store.
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
import { createRegistrySelector } from '@wordpress/data';

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
	receiveError( error, baseName, args = [] ) {
		invariant( error, 'error is required.' );
		invariant( baseName, 'baseName is required.' );
		invariant( args && Array.isArray( args ), 'args must be an array.' );

		return {
			type: RECEIVE_ERROR,
			payload: {
				error,
				baseName,
				args,
			},
		};
	},

	clearError( baseName, args = [] ) {
		if ( baseName ) {
			invariant( baseName, 'baseName is required.' );
			invariant(
				args && Array.isArray( args ),
				'args must be an array.'
			);
		}

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

export function createErrorStore( storeName ) {
	invariant( storeName, 'storeName must be defined.' );

	const initialState = {
		errors: {},
		errorArgs: {},
	};

	function reducer( state, { type, payload } ) {
		switch ( type ) {
			case RECEIVE_ERROR: {
				const { baseName, args, error } = payload;

				const key = generateErrorKey( baseName, args );
				return {
					...state,
					errors: {
						...( state.errors || {} ),
						[ key ]: error,
					},
					errorArgs: {
						...( state.errorArgs || {} ),
						[ key ]: args,
					},
				};
			}

			case CLEAR_ERROR: {
				const { baseName, args } = payload;
				const newState = { ...state };
				const key = generateErrorKey( baseName, args );
				newState.errors = { ...( state.errors || {} ) };
				newState.errorArgs = { ...( state.errorArgs || {} ) };

				delete newState.errors[ key ];
				delete newState.errorArgs[ key ];

				return newState;
			}

			case CLEAR_ERRORS: {
				const { baseName } = payload;
				const newState = { ...state };
				if ( baseName ) {
					newState.errors = { ...( state.errors || {} ) };
					newState.errorArgs = { ...( state.errorArgs || {} ) };
					for ( const key in newState.errors ) {
						if (
							key === baseName ||
							key.startsWith( `${ baseName }::` )
						) {
							delete newState.errors[ key ];
							delete newState.errorArgs[ key ];
						}
					}
				} else {
					newState.errors = {};
					newState.errorArgs = {};
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
			const { errors } = state;

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

			return Array.from( errorsSet );
		},

		/**
		 * Gets the meta-data for a given error object, or null if the error is not found.
		 *
		 * Returns meta-data in the format:
		 *
		 * ```
		 *	{
		 *		baseName: <string>,
		 *		args: <Array>
		 *	}
		 * ```
		 *
		 * @since 1.84.0
		 *
		 * @param {Object} state Data store's state.
		 * @param {Object} error Error object.
		 * @return {Object|null} Meta-data for the given error object, or null if the error is not found.
		 */
		getMetaDataForError( state, error ) {
			const key = Object.keys( state.errors ).find(
				( errorKey ) => state.errors[ errorKey ] === error
			);

			if ( key ) {
				const baseName = key.substring( 0, key.indexOf( '::' ) );
				return {
					baseName,
					args: state.errorArgs[ key ],
				};
			}

			return null;
		},

		/**
		 * Gets the selector data for a given error object, or null if no selector data is available.
		 *
		 * Returns selector data in the format:
		 *
		 * ```
		 *	{
		 *		storeName: <string>,
		 *		name: <string>,
		 *		args: <Array>
		 *	}
		 * ```
		 *
		 * @since 1.87.0
		 *
		 * @param {Object} state Data store's state.
		 * @param {Object} error Error object.
		 * @return {Object|null} Selector data for the given error object, or null if no selector data is available.
		 */
		getSelectorDataForError: createRegistrySelector(
			( select ) => ( state, error ) => {
				const metaData =
					select( storeName ).getMetaDataForError( error );

				if ( metaData ) {
					const { baseName: name, args } = metaData;

					const isSelector = !! select( storeName )[ name ];

					if ( isSelector ) {
						return {
							storeName,
							name,
							args,
						};
					}
				}

				return null;
			}
		),

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
