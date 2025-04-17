/**
 * `modules/adsense` data store: sites.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { get } from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createRegistrySelector,
} from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { isValidAccountID } from '../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
import { determineSiteFromDomain } from '../util/site';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

// Actions
const RESET_SITES = 'RESET_SITES';

const fetchGetSitesStore = createFetchStore( {
	baseName: 'getSites',
	controlCallback: ( { accountID } ) => {
		return get(
			'modules',
			'adsense',
			'sites',
			{ accountID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, sites, { accountID } ) => {
		if ( ! Array.isArray( sites ) ) {
			return state;
		}

		return {
			...state,
			sites: {
				...state.sites,
				[ accountID ]: [ ...sites ],
			},
		};
	},
	argsToParams: ( accountID ) => {
		return { accountID };
	},
	validateParams: ( { accountID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
	},
} );

const baseInitialState = {
	sites: {},
};

const baseActions = {
	/**
	 * Clears received sites, and unsets related selections.
	 *
	 * The `getSites` selector will be invalidated to allow sites to be re-fetched from the server.
	 *
	 * @since 1.72.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetSites() {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_SITES,
		};

		yield errorStoreActions.clearErrors( 'getSites' );

		return dispatch( MODULES_ADSENSE ).invalidateResolutionForStoreSelector(
			'getSites'
		);
	},
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_SITES: {
			const {
				siteID,
				accountStatus,
				siteStatus,
				accountSetupComplete,
				siteSetupComplete,
			} = state.savedSettings || {};
			return {
				...state,
				sites: initialState.sites,
				settings: {
					...( state.settings || {} ),
					siteID,
					accountStatus,
					siteStatus,
					accountSetupComplete,
					siteSetupComplete,
				},
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getSites( accountID ) {
		if ( undefined === accountID || ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const existingSites = registry
			.select( MODULES_ADSENSE )
			.getSites( accountID );

		// If there are already sites loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingSites ) {
			return;
		}

		yield fetchGetSitesStore.actions.fetchGetSites( accountID );
	},
};

const baseSelectors = {
	/**
	 * Gets all Google AdSense sites this account can access.
	 *
	 * @since 1.72.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch sites for.
	 * @return {(Array.<Object>|undefined)} An array of AdSense Sites; `undefined` if not loaded.
	 */
	getSites( state, accountID ) {
		if ( undefined === accountID ) {
			return undefined;
		}

		const { sites } = state;

		return sites[ accountID ];
	},
	/**
	 * Gets a Google AdSense site for a given domain, if it exists for the given account.
	 *
	 * @since 1.72.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to find a site for.
	 * @param {string} domain    The domain string to match to a site.
	 * @return {(Array.<Object>|null|undefined)} An array of AdSense sites; null if no match
	 * found or `undefined` if not loaded.
	 */
	getSite: createRegistrySelector(
		( select ) => ( state, accountID, domain ) => {
			const sites = select( MODULES_ADSENSE ).getSites( accountID );
			return determineSiteFromDomain( sites, domain );
		}
	),
	/**
	 * Gets the Google AdSense site object for the current site, if it exists for
	 * the given AdSense account.
	 *
	 * @since 1.72.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to find a site for.
	 * @return {(Array.string|null|undefined)} An array of AdSense sites; null if no match
	 * found or `undefined` if not loaded.
	 */
	getCurrentSite: createRegistrySelector(
		( select ) => ( state, accountID ) => {
			const currentSiteURL = select( CORE_SITE ).getReferenceSiteURL();
			const url = new URL( currentSiteURL );

			return select( MODULES_ADSENSE ).getSite( accountID, url.hostname );
		}
	),
};

const store = combineStores( fetchGetSitesStore, {
	initialState: baseInitialState,
	actions: baseActions,
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
