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
	) => {
		if ( ! select( MODULES_ANALYTICS_4 ) ) {
			return 'legacy';
		}

		const isAdminAPIWorking = select( MODULES_ANALYTICS_4 ).isAdminAPIWorking();

		if ( isAdminAPIWorking === false ) {
			return 'legacy';
		}

		if ( isAdminAPIWorking === undefined ) {
			return undefined;
		}

		const accountID = select( STORE_NAME ).getAccountID();

		if ( ! accountID ) {
			return 'ua';
		}

		if ( ! select( MODULES_ANALYTICS_4 ).getProperties( accountID )?.length > 0 ) {
			return 'ua';
		}

		if ( ! select( STORE_NAME ).getProperties( accountID )?.length > 0 ) {
			return 'ga4';
		}

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
