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

const baseInitialState = { };
const baseActions = {};
const baseControls = {};
const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};
const baseResolvers = {};
const baseSelectors = {

	// TODO - JSdoc
	isAdminAPIWorking( state ) {
		// The state['properties'] object has at least one account with a non-empty array of properties;
		for ( const propertyList of Object.values( state.properties ) ) {
			if ( propertyList && propertyList.length && propertyList.length > 0 ) {
				return true;
			}
		}

		// The state['webdatastreams'] object has at least one property with a non-empty array of web datastreams;
		for ( const webdatastreamList of Object.values( state.webdatastreams ) ) {
			if ( webdatastreamList && webdatastreamList.length && webdatastreamList.length > 0 ) {
				return true;
			}
		}

		// TODO - should be helper method exported from create-error-store? not sure what kind of encapuslation is wanted.

		// There are no entries in the state['errors'] object which key start with getProperties:: prefix;
		// There are no entries in the state['errors'] object which key start with getWebDataStreams:: prefix.
		for ( const errorKey in state.errors ) {
			if (
				errorKey.startsWith( 'getProperties' ) ||
                errorKey.startsWith( 'getWebDataStreams' )
			) {
				return false;
			}
		}

		return undefined;
	},
};

const store = Data.combineStores(
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
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
