/**
 * `modules/thank-with-google` datastore: publications.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { MODULES_THANK_WITH_GOOGLE } from './constants';

const { createRegistrySelector } = Data;

const fetchGetPublicationsStore = createFetchStore( {
	baseName: 'getPublications',
	storeName: MODULES_THANK_WITH_GOOGLE,
	controlCallback: () => {
		return API.get( 'modules', 'thank-with-google', 'publications' );
	},
	reducerCallback: ( state, publications ) => {
		return {
			...state,
			publications,
		};
	},
} );

const baseInitialState = {
	publications: undefined,
};

const baseResolvers = {
	*getPublications() {
		const registry = yield Data.commonActions.getRegistry();
		const existingPublications = registry
			.select( MODULES_THANK_WITH_GOOGLE )
			.getPublications();

		// If there are already publications loaded in the state, consider it fulfilled
		// and don't make an API request.
		if ( existingPublications ) {
			return;
		}

		yield fetchGetPublicationsStore.actions.fetchGetPublications();
	},
};

const baseSelectors = {
	/**
	 * Gets the list of publications from the server.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined|null)} Publications array list. Returns undefined if it is not loaded yet.
	 */
	getPublications( state ) {
		return state.publications;
	},

	/**
	 * Gets the current publication from the publications list.
	 *
	 * Returns the first item if only one publication is available in the list.
	 * If there are multiple publications in the list, returns one of them based on the following logic:
	 * - If the `publicationID` is set and that publication is in the list.
	 * - Otherwise, if any of the publications has its `state` field set to `ACTIVE`.
	 * - Otherwise, returns the first one in the list.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(Object|undefined|null)} Publication object. Returns undefined if it is not loaded yet.
	 * 																	Returns null if the publications list is empty.
	 */
	getCurrentPublication: createRegistrySelector( ( select ) => () => {
		const publications = select(
			MODULES_THANK_WITH_GOOGLE
		).getPublications();

		if ( publications === undefined ) {
			return undefined;
		}

		if ( publications.length === 0 ) {
			return null;
		}

		return (
			publications.find( ( p ) => p.publicationID ) ||
			publications.find( ( p ) => p.state === 'ACTIVE' ) ||
			publications[ 0 ]
		);
	} ),
};

const store = Data.combineStores( fetchGetPublicationsStore, {
	initialState: baseInitialState,
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
