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
import { MODULES_ANALYTICS } from './constants';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';

const { createRegistrySelector } = Data;

const LEGACY = 'legacy';
const UA = 'ua';
const GA4 = 'ga4';
const GA4_TRANSITIONAL = 'ga4-transitional';

const baseSelectors = {
	getSetupFlowMode: createRegistrySelector( ( select ) => () => {
		if ( ! select( MODULES_ANALYTICS_4 ) ) {
			return LEGACY;
		}

		const isAdminAPIWorking = select( MODULES_ANALYTICS_4 ).isAdminAPIWorking();

		if ( isAdminAPIWorking === undefined ) {
			return undefined;
		}

		if ( isAdminAPIWorking === false ) {
			return LEGACY;
		}

		// TODO - new test
		// check that accountID could have loaded
		if ( select( MODULES_ANALYTICS ).getSettings() === undefined ) {
			return undefined;
		}

		const accountID = select( MODULES_ANALYTICS ).getAccountID();

		if ( ! accountID ) {
			return UA;
		}

		const ga4Properties = select( MODULES_ANALYTICS_4 ).getProperties( accountID );

		// TODO - new test
		if ( ga4Properties === undefined ) {
			return undefined;
		}

		if ( ga4Properties.length === 0 ) {
			return UA;
		}

		const uaProperties = select( MODULES_ANALYTICS ).getProperties( accountID );

		// TODO - new test
		if ( uaProperties === undefined ) {
			return undefined;
		}

		if ( uaProperties.length === 0 ) {
			return GA4;
		}

		return GA4_TRANSITIONAL;
	} ),
};

const store = Data.combineStores(
	{
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
