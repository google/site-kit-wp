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
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

// Actions
const RESET_HTML_FOR_URL = 'RESET_HTML_FOR_URL';

const fetchHTMLForURLStore = createFetchStore( {
	baseName: 'getHTMLForURL',
	controlCallback: async ( { url } ) => {
		const fetchHTMLArgs = {
			credentials: 'omit',
			useCache: false,
			tagverify: 1,
			timestamp: Date.now(),
		};
		const html = await fetch( url, fetchHTMLArgs )
			.then( async ( res ) => {
				if ( ! res.ok ) {
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
	reducerCallback: ( state, htmlForURL, { url } ) => {
		return {
			...state,
			htmlForURL: {
				...state.htmlForURL,
				[ url ]: htmlForURL,
			},
		};
	},
	argsToParams: ( url ) => {
		invariant( isURL( url ), 'a valid url is required to fetch HTML.' );
		return { url };
	},
} );

export const BASE_INITIAL_STATE = {
	htmlForURL: {},
};

const baseActions = {
	*resetHTMLForURL( url ) {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: { url },
			type: RESET_HTML_FOR_URL,
		};

		return dispatch( STORE_NAME ).invalidateResolutionForStoreSelector( 'getHTMLForURL' );
	},
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RESET_HTML_FOR_URL: {
			const { url } = payload;
			return {
				...state,
				htmlForURL: {
					...state.htmlForURL,
					[ url ]: undefined,
				},
				isFetchingHTMLForURL: {
					...state.isFetchingHTMLForURL,
					[ url ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const baseResolvers = {
	*getHTMLForURL( url ) {
		const registry = yield Data.commonActions.getRegistry();

		const existingHTML = registry.select( STORE_NAME ).getHTMLForURL( url );

		if ( ! existingHTML ) {
			yield fetchHTMLForURLStore.actions.fetchGetHTMLForURL( url );
		}
	},
};

export const baseSelectors = {
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
		const { htmlForURL = {} } = state;

		return htmlForURL[ url ];
	},
};

const store = Data.combineStores(
	fetchHTMLForURLStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
