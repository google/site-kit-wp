/**
 * `modules/reader-revenue-manager` data store: view on site URL.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import apiFetch from '@wordpress/api-fetch';
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	type Select,
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

interface SearchResult {
	url?: string;
}

interface GetFirstPublicPostURLParams {
	postTypes: string[];
}

interface ViewOnSiteState {
	firstPublicPostURLs: Record< string, string | undefined >;
}

/**
 * Builds a stable cache key for a list of post types.
 *
 * @since n.e.x.t
 *
 * @param {Array.<string>} postTypes Post types to key by.
 * @return {string} The cache key.
 */
function getPostTypesKey( postTypes: string[] ): string {
	return [ ...postTypes ].sort().join( ',' );
}

const fetchGetFirstPublicPostURLStore = createFetchStore( {
	baseName: 'getFirstPublicPostURL',
	controlCallback: async ( {
		postTypes,
	}: GetFirstPublicPostURLParams ): Promise< string | null > => {
		const results: SearchResult[] = await apiFetch( {
			path: addQueryArgs( '/wp/v2/search', {
				type: 'post',
				subtype: postTypes.join( ',' ),
				per_page: 1,
			} ),
		} );

		// A fetch response can't be `undefined`, so a lack of a match is
		// represented by `null` and normalized to `undefined` when stored.
		return results?.[ 0 ]?.url || null;
	},
	reducerCallback: createReducer(
		(
			state: ViewOnSiteState,
			url: string | null,
			{ postTypes }: GetFirstPublicPostURLParams
		) => {
			state.firstPublicPostURLs[ getPostTypesKey( postTypes ) ] =
				url || undefined;
		}
	),
	argsToParams: ( postTypes: string[] = [] ) => ( { postTypes } ),
	validateParams: ( {
		postTypes,
	}: Partial< GetFirstPublicPostURLParams > = {} ) => {
		invariant(
			Array.isArray( postTypes ) && postTypes.length > 0,
			'postTypes is required and must be a non-empty array.'
		);
	},
} );

const baseInitialState: ViewOnSiteState = {
	firstPublicPostURLs: {},
};

const baseResolvers = {
	*getFirstPublicPostURL(
		postTypes: string[] = []
	): Generator< unknown, void, unknown > {
		// No post types to search for; skip the fetch rather than looping
		// on `undefined`.
		if ( ! postTypes.length ) {
			return;
		}

		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		const url = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getFirstPublicPostURL( postTypes );

		if ( url !== undefined ) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetFirstPublicPostURLStore.actions.fetchGetFirstPublicPostURL(
			postTypes
		);
	},
};

const baseSelectors = {
	/**
	 * Gets the URL of the first public post matching one of the given post types.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}         state       Data store's state.
	 * @param {Array.<string>} [postTypes] Post types to search for.
	 * @return {(string|undefined)} The post URL; `undefined` if there is no match, or it is not loaded yet.
	 */
	getFirstPublicPostURL(
		state: ViewOnSiteState,
		postTypes: string[] = []
	): string | undefined {
		if ( ! postTypes.length ) {
			return undefined;
		}

		return state.firstPublicPostURLs[ getPostTypesKey( postTypes ) ];
	},

	/**
	 * Resolves the URL to preview the CTA on the site, based on the configured
	 * CTA placement.
	 *
	 * For the `sitewide` placement this is the site's front page. For the
	 * `post_types` placement it is the first public post matching one of the
	 * selected post types. Any other placement, or an unresolvable post URL,
	 * yields `undefined` so the calling component can omit the CTA.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The URL, or `undefined` if there is none.
	 */
	getViewOnSiteURL: createRegistrySelector(
		( select: Select ) => (): string | undefined => {
			const snippetMode = select(
				MODULES_READER_REVENUE_MANAGER
			).getSnippetMode();

			if ( snippetMode === 'sitewide' ) {
				return select( CORE_SITE ).getHomeURL();
			}

			if ( snippetMode === 'post_types' ) {
				const postTypes = select(
					MODULES_READER_REVENUE_MANAGER
				).getPostTypes();

				if ( ! Array.isArray( postTypes ) || ! postTypes.length ) {
					return undefined;
				}

				return select(
					MODULES_READER_REVENUE_MANAGER
				).getFirstPublicPostURL( postTypes );
			}

			return undefined;
		}
	),
};

interface Store {
	initialState: ViewOnSiteState;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores( fetchGetFirstPublicPostURLStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} ) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
