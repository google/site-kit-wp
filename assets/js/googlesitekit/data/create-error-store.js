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

const SET_ERROR_FOR_SELECTOR = 'SET_ERROR_FOR_SELECTOR';
const SET_ERROR_FOR_ACTION = 'SET_ERROR_FOR_ACTION';
const CLEAR_SELECTOR_ERROR = 'CLEAR_SELECTOR_ERROR';
const CLEAR_SELECTOR_ERRORS = 'CLEAR_SELECTOR_ERRORS';
const CLEAR_ACTION_ERROR = 'CLEAR_ACTION_ERROR';
const CLEAR_ACTION_ERRORS = 'CLEAR_ACTION_ERRORS';

/**
 * Internal dependencies
 */
import { stringifyObject } from '@/js/util';
import { createReducer } from 'googlesitekit-data';

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
	/**
	 * Sets an error for a selector.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}      error        Error object.
	 * @param {string}      selectorName Selector name.
	 * @param {Array.<any>} [args]       Arguments passed to selector (default `[]`).
	 * @return {Object} Redux-style action.
	 */
	setErrorForSelector( error, selectorName, args = [] ) {
		invariant( error, 'error is required.' );
		invariant( selectorName, 'selectorName is required.' );
		invariant( args && Array.isArray( args ), 'args must be an array.' );

		return {
			type: SET_ERROR_FOR_SELECTOR,
			payload: {
				error,
				baseName: selectorName,
				args,
			},
		};
	},

	/**
	 * Sets an error for an action.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}      error      Error object.
	 * @param {string}      actionName Action name.
	 * @param {Array.<any>} [args]     Arguments passed to action (default `[]`).
	 * @return {Object} Redux-style action.
	 */
	setErrorForAction( error, actionName, args = [] ) {
		invariant( error, 'error is required.' );
		invariant( actionName, 'actionName is required.' );
		invariant( args && Array.isArray( args ), 'args must be an array.' );

		return {
			type: SET_ERROR_FOR_ACTION,
			payload: {
				error,
				baseName: actionName,
				args,
			},
		};
	},

	/**
	 * Clears the error for a given selector name and args.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}      selectorName Selector name.
	 * @param {Array.<any>} [args]       Arguments passed to selector (default `[]`).
	 * @return {Object} Redux-style action.
	 */
	clearSelectorError( selectorName, args = [] ) {
		invariant( selectorName, 'selectorName is required.' );
		invariant( args && Array.isArray( args ), 'args must be an array.' );

		return {
			type: CLEAR_SELECTOR_ERROR,
			payload: {
				baseName: selectorName,
				args,
			},
		};
	},

	/**
	 * Clears all selector errors, optionally filtered by selector name.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} [selectorName] Optional selector name to clear errors for.
	 * @return {Object} Redux-style action.
	 */
	clearSelectorErrors( selectorName ) {
		return {
			type: CLEAR_SELECTOR_ERRORS,
			payload: {
				baseName: selectorName,
			},
		};
	},

	/**
	 * Clears the error for a given action name and args.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}      actionName Action name.
	 * @param {Array.<any>} [args]     Arguments passed to action (default `[]`).
	 * @return {Object} Redux-style action.
	 */
	clearActionError( actionName, args = [] ) {
		invariant( actionName, 'actionName is required.' );
		invariant( args && Array.isArray( args ), 'args must be an array.' );

		return {
			type: CLEAR_ACTION_ERROR,
			payload: {
				baseName: actionName,
				args,
			},
		};
	},

	/**
	 * Clears all action errors, optionally filtered by action name.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} [actionName] Optional action name to clear errors for.
	 * @return {Object} Redux-style action.
	 */
	clearActionErrors( actionName ) {
		return {
			type: CLEAR_ACTION_ERRORS,
			payload: {
				baseName: actionName,
			},
		};
	},
};

export function createErrorStore( storeName ) {
	invariant( storeName, 'storeName must be defined.' );

	const initialState = {
		selectorErrors: {},
		selectorErrorArgs: {},
		actionErrors: {},
		actionErrorArgs: {},
	};

	function setErrorInSlice( state, errorsKey, errorArgsKey, payload ) {
		const { baseName, args, error } = payload;
		const key = generateErrorKey( baseName, args );
		state[ errorsKey ] = state[ errorsKey ] || {};
		state[ errorArgsKey ] = state[ errorArgsKey ] || {};
		state[ errorsKey ][ key ] = error;
		state[ errorArgsKey ][ key ] = args;
	}

	function clearErrorInSlice(
		state,
		errorsKey,
		errorArgsKey,
		baseName,
		args
	) {
		const key = generateErrorKey( baseName, args );
		state[ errorsKey ] = state[ errorsKey ] || {};
		state[ errorArgsKey ] = state[ errorArgsKey ] || {};
		delete state[ errorsKey ][ key ];
		delete state[ errorArgsKey ][ key ];
	}

	function clearErrorsInSlice( state, errorsKey, errorArgsKey, baseName ) {
		if ( baseName ) {
			state[ errorsKey ] = state[ errorsKey ] || {};
			state[ errorArgsKey ] = state[ errorArgsKey ] || {};
			for ( const key in state[ errorsKey ] ) {
				if ( key === baseName || key.startsWith( `${ baseName }::` ) ) {
					delete state[ errorsKey ][ key ];
					delete state[ errorArgsKey ][ key ];
				}
			}
		} else {
			state[ errorsKey ] = {};
			state[ errorArgsKey ] = {};
		}
	}

	const reducer = createReducer( ( state, { type, payload } ) => {
		switch ( type ) {
			case SET_ERROR_FOR_SELECTOR: {
				setErrorInSlice(
					state,
					'selectorErrors',
					'selectorErrorArgs',
					payload
				);
				break;
			}

			case SET_ERROR_FOR_ACTION: {
				setErrorInSlice(
					state,
					'actionErrors',
					'actionErrorArgs',
					payload
				);
				break;
			}

			case CLEAR_SELECTOR_ERROR: {
				const { baseName, args } = payload;
				clearErrorInSlice(
					state,
					'selectorErrors',
					'selectorErrorArgs',
					baseName,
					args
				);
				break;
			}

			case CLEAR_SELECTOR_ERRORS: {
				const { baseName } = payload;
				clearErrorsInSlice(
					state,
					'selectorErrors',
					'selectorErrorArgs',
					baseName
				);
				break;
			}

			case CLEAR_ACTION_ERROR: {
				const { baseName, args } = payload;
				clearErrorInSlice(
					state,
					'actionErrors',
					'actionErrorArgs',
					baseName,
					args
				);
				break;
			}

			case CLEAR_ACTION_ERRORS: {
				const { baseName } = payload;
				clearErrorsInSlice(
					state,
					'actionErrors',
					'actionErrorArgs',
					baseName
				);
				break;
			}
		}
	} );

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
			const { selectorErrors } = state;
			return selectorErrors[ generateErrorKey( selectorName, args ) ];
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
			const { actionErrors } = state;
			return actionErrors[ generateErrorKey( actionName, args ) ];
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
			const { selectorErrors, actionErrors } = state;

			invariant( baseName, 'baseName is required.' );

			const key = generateErrorKey( baseName, args );
			return selectorErrors[ key ] || actionErrors[ key ];
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
			const errorsSet = new Set( [
				...Object.values( state.selectorErrors ),
				...Object.values( state.actionErrors ),
			] );

			return Array.from( errorsSet );
		},

		/**
		 * Gets the meta-data for a given selector error object, or null if the error is not found.
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
		 * @return {Object|null} Meta-data for the given selector error object, or null if the error is not found.
		 */
		getMetaDataForSelectorError( state, error ) {
			const selectorKey = Object.keys( state.selectorErrors ).find(
				( errorKey ) => state.selectorErrors[ errorKey ] === error
			);

			if ( selectorKey ) {
				const baseName = selectorKey.substring(
					0,
					selectorKey.indexOf( '::' )
				);
				return {
					baseName,
					args: state.selectorErrorArgs[ selectorKey ],
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
			( select ) =>
				function ( state, error ) {
					const metaData =
						select( storeName ).getMetaDataForSelectorError(
							error
						);

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
