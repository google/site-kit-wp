/**
 * API function to create fetch infrastructure.
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

/**
 * Creates a store object implementing the necessary infrastructure for a
 * single fetch action.
 *
 * This function returns a partial store object with the following:
 * * action creators to fetch and to receive the data
 * * control to issue the API request
 * * reducer to set API request flag and receive the response
 * * selector to check whether the API request is in progress via flag
 *
 * The names of the pieces are based on the baseName provided.
 * For example, if baseName is 'saveSettings':
 * * The fetch action creator is called 'fetchSaveSettings'.
 * * The receive action creator is called 'receiveSaveSettings'.
 * * The fetching selector is called 'isFetchingSaveSettings'.
 *
 * All parts of the returned store objects should be considered internal. A
 * public action or selector should be implemented to actually call the
 * fetch action included in the returned store object.
 *
 * For example, if the fetch infrastructure is intended for an API-based
 * action 'storeMySetting':
 * * The basename passed should be 'storeMySetting'.
 * * The action 'storeMySetting' should call 'fetchStoreMySetting'.
 *
 * Or, if the fetch infrastructure is intended for an API-based selector
 * 'getSomeData':
 * * The baseName passed should be 'getSomeData'.
 * * The resolver for 'getSomeData' should call 'fetchGetSomeData'.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object}   options                 Options for creating the fetch infrastructure.
 * @param {string}   options.baseName        The base name to use for all the created infrastructure.
 * @param {Function} options.apiCallback     Callback function to issue the API request. Will be used inside the
 *                                           control. The function receives a params object with the same keys
 *                                           specified in keyParams, and the respective values passed to the action.
 * @param {Function} options.receiveCallback Callback function to modify state based on the API response. Will be used
 *                                           inside the reducer. The  function receives the store's state object as
 *                                           first parameter, the API response as second parameter, and the params
 *                                           object for the request (see above) as third parameter.
 * @param {?Object}  options.keyParams       Optional. Object with arguments definition to require for the fetch action
 *                                           and the selector to check for active API requests. Argument names should
 *                                           be used as keys, and a callback to be passed to invariant should be used
 *                                           as values. If no callback is provided for an argument, the default will be
 *                                           accepting any value other than undefined.
 * @return {Object} Partial store object with properties 'actions', 'controls', 'reducer', 'resolvers', and 'selectors'.
 */
export const createFetchInfrastructure = ( {
	baseName,
	apiCallback,
	receiveCallback,
	keyParams = {},
} ) => {
	invariant( baseName, 'baseName is required.' );
	invariant( 'function' === typeof apiCallback, 'apiCallback is required.' );
	invariant( 'function' === typeof receiveCallback, 'receiveCallback is required.' );

	const pascalCaseBaseName = baseName.charAt( 0 ).toUpperCase() + baseName.slice( 1 );
	const constantBaseName = baseName.replace( /([a-z0-9]{1})([A-Z]{1})/g, '$1_$2' ).toUpperCase();

	const FETCH = `FETCH_${ constantBaseName }`;
	const START_FETCH = `START_FETCH_${ constantBaseName }`;
	const FINISH_FETCH = `FINISH_FETCH_${ constantBaseName }`;
	const CATCH_FETCH = `CATCH_FETCH_${ constantBaseName }`;
	const RECEIVE = `RECEIVE_${ constantBaseName }`;

	const fetchCreator = `fetch${ pascalCaseBaseName }`;
	const receiveCreator = `receive${ pascalCaseBaseName }`;
	const isFetching = `isFetching${ pascalCaseBaseName }`;

	const actions = {
		[ fetchCreator ]: function*( ...args ) { // eslint-disable-line object-shorthand
			let response, error, params;

			try {
				params = argsToParamsObject( args, keyParams );
			} catch ( err ) {
				// Parameters should never be invalid here, this needs to be
				// strict and inform the developer of the issue.
				global.console.error( err.message );
				error = err;
				return { response, error };
			}

			yield {
				payload: { params },
				type: START_FETCH,
			};

			try {
				response = yield {
					payload: { params },
					type: FETCH,
				};

				yield actions[ receiveCreator ]( response, params );

				yield {
					payload: { params },
					type: FINISH_FETCH,
				};
			} catch ( e ) {
				error = e;

				yield {
					payload: { error, params },
					type: CATCH_FETCH,
				};
			}

			return { response, error };
		},

		[ receiveCreator ]: function( response, params ) { // eslint-disable-line object-shorthand
			invariant( 'undefined' !== typeof response, 'response is required.' );

			// If params are required, ensure they are passed, otherwise use
			// default empty object.
			if ( Object.keys( keyParams ).length ) {
				invariant( 'object' === typeof params, 'params is required.' );
			} else {
				params = {};
			}

			return {
				payload: { response, params },
				type: RECEIVE,
			};
		},
	};

	const controls = {
		[ FETCH ]: ( { payload } ) => {
			return apiCallback( payload.params );
		},
	};

	const reducer = ( state, { type, payload } ) => {
		switch ( type ) {
			case START_FETCH: {
				const { params } = payload;
				return {
					...state,
					[ isFetching ]: {
						...( state[ isFetching ] || {} ),
						[ stringifyObject( params ) ]: true,
					},
				};
			}

			case RECEIVE: {
				const { response, params } = payload;
				return receiveCallback( state, response, params );
			}

			case FINISH_FETCH: {
				const { params } = payload;
				return {
					...state,
					[ isFetching ]: {
						...( state[ isFetching ] || {} ),
						[ stringifyObject( params ) ]: false,
					},
				};
			}

			case CATCH_FETCH: {
				const { error, params } = payload;
				return {
					...state,
					error,
					[ isFetching ]: {
						...( state[ isFetching ] || {} ),
						[ stringifyObject( params ) ]: false,
					},
				};
			}

			default: {
				return { ...state };
			}
		}
	};

	const selectors = {
		[ isFetching ]: ( state, ...args ) => {
			if ( 'undefined' === typeof state[ isFetching ] ) {
				return false;
			}

			let params;
			try {
				params = argsToParamsObject( args, keyParams );
			} catch ( err ) {
				// If parameters are invalid, fail silently here. It likely is
				// because some dependency selector is still resolving.
				return false;
			}

			return !! state[ isFetching ][ stringifyObject( params ) ];
		},
	};

	return {
		actions,
		controls,
		reducer,
		resolvers: {},
		selectors,
	};
};

/**
 * Validates arguments against a parameter definition and returns a params
 * object with all arguments keyed by their name.
 *
 * Throws an error if any argument is invalid.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Array}  args      Arguments passed to the original function.
 * @param {Object} keyParams Object with arguments definition to require for the fetch action
 *                           and the selector to check for active API requests. Argument names should
 *                           be used as keys, and a callback to be passed to invariant should be used
 *                           as values. If no callback is provided for an argument, the default will be
 *                           accepting any value other than undefined.
 * @return {Object} Arguments keyed by their name.
 */
const argsToParamsObject = ( args, keyParams ) => {
	const params = {};

	const paramNames = Object.keys( keyParams );
	let i = 0;
	for ( i = 0; i < paramNames.length; i++ ) {
		const paramName = paramNames[ i ];
		const paramValue = args[ i ];

		let paramCallback = keyParams[ paramName ];
		if ( 'function' !== typeof paramCallback ) {
			paramCallback = ( value ) => 'undefined' !== typeof value;
		}

		invariant( paramCallback( paramValue ), `${ paramName } is required.` );

		params[ paramName ] = paramValue;
	}

	return params;
};
