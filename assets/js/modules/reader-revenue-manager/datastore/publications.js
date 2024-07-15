/**
 * `modules/reader-revenue-manager` data store: publications.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { commonActions, combineStores } from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATE,
} from './constants';

const fetchGetPublicationsStore = createFetchStore( {
	baseName: 'getPublications',
	controlCallback: () =>
		API.get(
			'modules',
			'reader-revenue-manager',
			'publications',
			{},
			{ useCache: true }
		),
	reducerCallback: ( state, publications ) => ( { ...state, publications } ),
} );

const baseInitialState = {
	publications: undefined,
};

const baseActions = {
	/**
	 * Finds a matched publication.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object|null} Matched publication; `null` if none found.
	 */
	*findMatchedPublication() {
		const { resolveSelect } = yield commonActions.getRegistry();
		const publications = yield commonActions.await(
			resolveSelect( MODULES_READER_REVENUE_MANAGER ).getPublications()
		);

		if ( publications.length === 0 ) {
			return null;
		}

		if ( publications.length === 1 ) {
			return publications[ 0 ];
		}

		const completedOnboardingPublication = publications.find(
			( publication ) =>
				publication.onboardingState ===
				PUBLICATION_ONBOARDING_STATE.ONBOARDING_COMPLETE
		);

		return completedOnboardingPublication || publications[ 0 ];
	},
};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default:
			return state;
	}
};

const baseResolvers = {
	*getPublications() {
		const registry = yield commonActions.getRegistry();
		// Only fetch publications if there are none in the store.
		const publications = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublications();
		if ( publications === undefined ) {
			yield fetchGetPublicationsStore.actions.fetchGetPublications();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets list of publications associated with the account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} An array of publications; `undefined` if not loaded.
	 */
	getPublications( state ) {
		return state.publications;
	},
};

const store = combineStores( fetchGetPublicationsStore, {
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
