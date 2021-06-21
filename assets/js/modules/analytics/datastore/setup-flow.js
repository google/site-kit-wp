/**
 * `modules/analytics` data store: setup-flow.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS,
	SETUP_FLOW_MODE_LEGACY,
	SETUP_FLOW_MODE_UA,
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
	ACCOUNT_CREATE,
} from './constants';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';
import { isFeatureEnabled } from '../../../features';

const { createRegistrySelector } = Data;

const baseSelectors = {
	getSetupFlowMode: createRegistrySelector( ( select ) => () => {
		// The Google Analytics 4 is not enabled, so we have
		// to use the legacy implementation.
		if ( ! isFeatureEnabled( 'ga4setup' ) ) {
			return SETUP_FLOW_MODE_LEGACY;
		}

		// Check to see if the Admin API is working—if it's `false` we should also use
		// the legacy analytics because the API isn't working properly.
		const isAdminAPIWorking = select( MODULES_ANALYTICS_4 ).isAdminAPIWorking();
		if ( isAdminAPIWorking === false ) {
			return SETUP_FLOW_MODE_LEGACY;
		}

		// Ensure the Analytics settings have loaded. If we check
		// `select( MODULES_ANALYTICS ).getAccountID();` directly, it
		// could return `undefined` because the settings are loading OR
		// because accountID is not set. Ensuring the settings are loaded
		// means an `undefined` accountID is legitimate.
		// See: https://github.com/google/site-kit-wp/pull/3260#discussion_r623924928
		if ( select( MODULES_ANALYTICS ).getSettings() === undefined ) {
			return undefined;
		}

		const accountID = select( MODULES_ANALYTICS ).getAccountID();

		// If no accountID exists then no account is selected. This means we should
		// use the UA setup flow.
		if ( ! accountID || accountID === ACCOUNT_CREATE ) {
			return SETUP_FLOW_MODE_UA;
		}

		const ga4Properties = select( MODULES_ANALYTICS_4 ).getProperties( accountID );

		if ( ga4Properties === undefined ) {
			return undefined;
		}

		// If there are no GA4 properties available for this account, don't use
		// GA4 and use the UA version.
		if ( ga4Properties.length === 0 ) {
			return SETUP_FLOW_MODE_UA;
		}

		const uaProperties = select( MODULES_ANALYTICS ).getProperties( accountID );

		if ( uaProperties === undefined ) {
			return undefined;
		}

		// If no UA properties exist and there are GA4 properties, use GA4-only.
		if ( uaProperties.length === 0 ) {
			return SETUP_FLOW_MODE_GA4;
		}

		// There are UA and GA4 properties, so use the transitional mode.
		return SETUP_FLOW_MODE_GA4_TRANSITIONAL;
	} ),
};

const store = Data.combineStores( {
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
