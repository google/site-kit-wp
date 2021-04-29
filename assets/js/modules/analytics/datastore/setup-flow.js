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
import { STORE_NAME } from './constants';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';

const { createRegistrySelector } = Data;

const baseSelectors = {
	getSetupFlowMode: createRegistrySelector( ( select ) => (
		// state
	) => {
		// implement requirements from the AC section.

		// If the modules/analytics-4 store is not available, it should return “legacy”.
		if ( ! select( MODULES_ANALYTICS_4 ) ) {
			return 'legacy';
		}

		const isAdminAPIWorking = select( MODULES_ANALYTICS_4 ).isAdminAPIWorking();

		// If isAdminAPIWorking() returns false -> return “legacy”
		if ( isAdminAPIWorking === false ) {
			return 'legacy';
		}

		// If isAdminAPIWorking() returns undefined -> return undefined
		if ( isAdminAPIWorking === undefined ) {
			return undefined;
		}

		const accountID = select( STORE_NAME ).getAccountID();

		// If there is no account selected, it should return “ua”.
		if ( ! accountID ) {
			return 'ua';
		}

		// If there is an account selected for which the modules/analytics-4 store selector getProperties returns an empty array (i.e. no GA4 properties), it should return “ua”.

		if ( select( MODULES_ANALYTICS_4 ).getProperties( accountID ).length === 0 ) {
			return 'ua';
		}

		// If there is an account selected for which the modules/analytics store selector getProperties returns an empty array (i.e. no UA properties), it should return “ga4”.
		if ( select( STORE_NAME ).getProperties( accountID ).length === 0 ) {
			return 'ga4';
		}

		// If there is an account selected for which both the modules/analytics and modules/analytics-4 selectors getProperties return a non-empty array, it should return “ga4-transitional”.
		return 'ga4-transitional';
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
