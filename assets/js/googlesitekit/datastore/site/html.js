/**
 * `core/site` data store: HTML for URL.
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
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { isURL, addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	commonActions,
	combineStores,
	createRegistryControl,
} from 'googlesitekit-data';
import API from 'googlesitekit-api';
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { extractExistingTag } from '../../../util/tag';

const fetchHTMLForURLStore = createFetchStore( {
	baseName: 'getHTMLForURL',
	argsToParams: ( url ) => {
		return { url };
	},
	validateParams: ( { url } = {} ) => {
		invariant( isURL( url ), 'a valid url is required to fetch HTML.' );
	},
	controlCallback: async ( { url } ) => {
		const fetchHTMLOptions = {
			credentials: 'omit',
		};
		const fetchHTMLQueryArgs = {
			// Indicates a tag checking request. This lets Site Kit know not to output its own tags.
			tagverify: 1,
			// Add a timestamp for cache-busting.
			//
			// This value is used for cache-busting, so we don't want to rely on
			// the reference date. We should always use the current time.
			timestamp: Date.now(), // eslint-disable-line sitekit/no-direct-date
		};
		const response = await fetch(
			addQueryArgs( url, fetchHTMLQueryArgs ),
			fetchHTMLOptions
		);

		// If response contains HTML, return that. Return null in other cases.
		try {
			const html = await response.text();
			if ( html === '' || html === undefined ) {
				return null;
			}
			return html;
		} catch {
			return null;
		}
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
} );

// Actions
const RESET_HTML_FOR_URL = 'RESET_HTML_FOR_URL';
const CHECK_FOR_SETUP_TAG = 'CHECK_FOR_SETUP_TAG';

// Errors
const ERROR_FETCH_FAIL = 'check_fetch_failed';
const ERROR_TOKEN_MISMATCH = 'setup_token_mismatch';

export const baseInitialState = {
	htmlForURL: {},
};

const baseActions = {
	/**
	 * Resets the HTML for a given URL.
	 *
	 * @since 1.13.0
	 * @private
	 *
	 * @param {string} url URL for which the HTML should be reset.
	 * @return {Object} Redux-style action.
	 */
	*resetHTMLForURL( url ) {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			payload: { url },
			type: RESET_HTML_FOR_URL,
		};

		return dispatch( CORE_SITE ).invalidateResolutionForStoreSelector(
			'getHTMLForURL'
		);
	},

	*checkForSetupTag() {
		return yield {
			payload: {},
			type: CHECK_FOR_SETUP_TAG,
		};
	},
};

const baseControls = {
	[ CHECK_FOR_SETUP_TAG ]: createRegistryControl(
		( registry ) => async () => {
			let error;
			let response;
			let token;
			let tokenMatch = false;

			try {
				( { token } = await API.set( 'core', 'site', 'setup-tag' ) );
				const homeURL = await registry.select( CORE_SITE ).getHomeURL();

				( { response, error } = await registry
					.dispatch( CORE_SITE )
					.fetchGetHTMLForURL( homeURL ) );
			} catch {
				error = ERROR_FETCH_FAIL;
			}
			if ( ! error ) {
				const scrapedTag = extractExistingTag( response, [
					/<meta name="googlesitekit-setup" content="([a-z0-9-]+)"/,
				] );
				tokenMatch = token === scrapedTag;

				if ( ! tokenMatch ) {
					error = ERROR_TOKEN_MISMATCH;
				}
			}

			return { response: tokenMatch, error };
		}
	),
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
			};
		}

		default: {
			return state;
		}
	}
};

export const baseResolvers = {
	*getHTMLForURL( url ) {
		const registry = yield commonActions.getRegistry();

		const existingHTML = registry.select( CORE_SITE ).getHTMLForURL( url );

		if ( existingHTML === undefined ) {
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
	 * @since 1.13.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} url   URL for which to fetch HTML.
	 * @return {(string|undefined)} String representation of HTML for given URL, or `undefined` if not loaded yet.
	 */
	getHTMLForURL( state, url ) {
		return state.htmlForURL[ url ];
	},
};

const store = combineStores( fetchHTMLForURLStore, {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
