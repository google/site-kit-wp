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
 * Internal dependencies.
 */
import API from 'googlesitekit-api';
import { commonActions, combineStores } from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

/* eslint-disable sitekit/acronym-case */
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
	 * Syncronizes the onboarding state of the publication with the API.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	*syncPublicationOnboardingState() {
		const registry = yield commonActions.getRegistry();
		const modules = registry.select( CORE_MODULES ).getModules();

		if ( modules === undefined ) {
			return;
		}

		const connected = registry
			.select( CORE_MODULES )
			.isModuleConnected( 'reader-revenue-manager' );

		// If the module is not connected, do not attempt to sync the onboarding state.
		if ( ! connected ) {
			return;
		}

		const publicationID = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationID();

		// If there is no publication ID, do not attempt to sync the onboarding state.
		if ( publicationID === undefined ) {
			return;
		}

		const publications = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublications();

		// If there are no publications, do not attempt to sync the onboarding state.
		if ( publications === undefined ) {
			return;
		}

		const publication = publications.find(
			( { publicationId } ) => publicationId === publicationID
		);

		const { onboardingState } = publication;
		const currentOnboardingState = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationOnboardingState();

		let settings = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getSettings();

		if ( onboardingState !== currentOnboardingState ) {
			settings = {
				...settings,
				publicationOnboardingState: onboardingState,
			};
		}

		settings = {
			...settings,
			/* eslint-disable-next-line sitekit/no-direct-date */
			publicationOnboardingStateLastSyncedAtMs: Date.now(),
		};

		yield registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setSettings( settings );

		yield registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.saveSettings( settings );
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
