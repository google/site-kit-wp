/**
 * core/site data store: HTML for URL.
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
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';

// Actions
const START_FETCH_HTML_FOR_URL = 'START_FETCH_HTML_FOR_URL';
const FETCH_HTML_FOR_URL = 'FETCH_HTML_FOR_URL';
const FINISH_FETCH_HTML_FOR_URL = 'FINISH_FETCH_HTML_FOR_URL';
const CATCH_FETCH_HTML_FOR_URL = 'CATCH_FETCH_HTML_FOR_URL';
const INVALIDATE_HTML_FOR_URL = 'INVALIDATE_HTML_FOR_URL';

const RECEIVE_HTML_FOR_URL = 'RECEIVE_HTML_FOR_URL';

export const INITIAL_STATE = {
	html: {},
	isFetchingHTML: {},
};

export const actions = {
	/**
	 * Dispatches an action that creates an HTTP request.
	 *
	 * Requests the HTML for a URL.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} url URL for which to fetch HTML.
	 * @return {Object} Object with {response, error}
	 */
	*fetchHTMLForURL( url ) {
		invariant( isURL( url ), 'a valid url is required to fetch HTML.' );
		let response, error;

		yield {
			payload: { url },
			type: START_FETCH_HTML_FOR_URL,
		};

		try {
			response = yield {
				payload: { url },
				type: FETCH_HTML_FOR_URL,
			};

			yield actions.receiveHTMLForURL( response, url );

			yield {
				payload: { url },
				type: FINISH_FETCH_HTML_FOR_URL,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					error,
					url,
				},
				type: CATCH_FETCH_HTML_FOR_URL,
			};
		}

		return { response, error };
	},

	/**
	 * Invalidates the resolver for HTML for URL and re-runs fetchHTMLForURL.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} url URL for which the resolver should be invalidated.
	 * @return {Object} Redux-style action.
	 */
	*invalidateHTMLForURL( url ) {
		invariant( isURL( url ), 'a valid url is required to invalidate HTML.' );
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: { url },
			type: INVALIDATE_HTML_FOR_URL,
		};

		return dispatch( STORE_NAME )
			.invalidateResolution( 'getHTMLForURL', [ url ] );
	},

	/**
	 * Stores HTML string received from the REST API.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} htmlForURL HTML string returned from the API.
	 * @param {string} url URL for which the HTML was fetched.
	 * @return {Object} Redux-style action.
	 */
	receiveHTMLForURL( htmlForURL, url ) {
		invariant( htmlForURL, 'html for URL is required.' );
		invariant( isURL( url ), 'a valid url is required.' );

		return {
			payload: { htmlForURL, url },
			type: RECEIVE_HTML_FOR_URL,
		};
	},
};

export const controls = {
	[ FETCH_HTML_FOR_URL ]: async ( { payload: { url } } ) => {
		const fetchHTMLArgs = {
			credentials: 'omit',
			useCache: false,
			timestamp: Date.now(),
		};
		const html = await fetch( url, fetchHTMLArgs )
			.then( ( res ) => {
				if ( ! res.ok ) {
					// TODO: Properly throw errors.
					throw {
						code: res.statusText,
						message: res.statusText,
						data: { status: res.status },
					};
				}
				return res.text();
			} ).catch( ( error ) => {
				throw error;
			} );

		return html;
	},
};

export const reducer = ( state, { type, payload } ) => {
	// TODO: Remove console.log.
	// console.log(`REDUCER ${type}:`,payload );
	switch ( type ) {
		case START_FETCH_HTML_FOR_URL: {
			const { url } = payload;
			return {
				...state,
				isFetchingHTML: {
					...state.isFetchingHTML,
					[ url ]: true,
				},
			};
		}

		case RECEIVE_HTML_FOR_URL: {
			const { htmlForURL, url } = payload;

			return {
				...state,
				html: {
					...state.html,
					[ url ]: htmlForURL,
				},
			};
		}

		case FINISH_FETCH_HTML_FOR_URL: {
			const { url } = payload;
			return {
				...state,
				isFetchingHTML: {
					...state.isFetchingHTML,
					[ url ]: false,
				},
			};
		}

		case CATCH_FETCH_HTML_FOR_URL: {
			const { error, url } = payload;
			return {
				...state,
				error,
				isFetchingHTML: {
					...state.isFetchingHTML,
					[ url ]: false,
				},
			};
		}

		case INVALIDATE_HTML_FOR_URL: {
			const { url } = payload;
			const { html, isFetchingHTML } = state;

			return {
				...state,
				html: {
					...html,
					[ url ]: undefined,
				},
				isFetchingHTML: {
					...isFetchingHTML,
					[ url ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getHTMLForURL( url ) {
		const registry = yield Data.commonActions.getRegistry();

		const existingHTML = registry.select( STORE_NAME ).getHTMLForURL( url );

		if ( ! existingHTML ) {
			yield actions.fetchHTMLForURL( url );
		}
	},
};

export const selectors = {
	/**
	 * Gets the HTML for a given URL.
	 *
	 * Returns `undefined` if the HTML is not available/loaded.
	 *
	 * Returns a string representation of the HTML when successful.
	 *
	 * @private
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} url URL for which to fetch HTML.
	 * @return {(Object|undefined)} String representation of HTML for given URL.
	 */
	getHTMLForURL( state, url ) {
		const { html = {} } = state;

		return html[ url ];
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
