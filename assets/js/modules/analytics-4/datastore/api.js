/**
 * `modules/analytics-4` data store: api.
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

const baseSelectors = {
	/**
	 * Checks if the Admin API is working.
	 *
	 * Returns false if there are any errors for getProperties or getWebDataStreams.
	 *
	 * Returns true if getProperties or getWebDataStreams has fetched successfully.
	 *
	 * This selector returns undefined if either `getProperties` or `getWebDataStreams` selectors have not resolved.
	 *
	 * @since 1.32.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} True, false, or undefined.
	 */
	isAdminAPIWorking( state ) {
		// This is against normal state access conventions.
		// Usually we build selectors for any state access and avoid
		// looking around state internals.
		// But we are working with an Alpha, unstable Google API at the time
		// of development.
		for ( const errorKey in state.errors ) {
			if (
				errorKey.startsWith( 'getProperties::' ) ||
				errorKey.startsWith( 'getWebDataStreams::' ) ||
				errorKey.startsWith( 'getAccountSummaries::' )
			) {
				return false;
			}
		}

		// We expect that properties have been already pulled for one of the accounts.
		// Make sure to call `getProperties` selector before relying on this one.
		if ( Object.keys( state.properties ).length > 0 ) {
			return true;
		}

		return undefined;
	},
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
