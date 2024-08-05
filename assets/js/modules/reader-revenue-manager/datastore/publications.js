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
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { commonActions, combineStores } from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	PUBLICATION_ONBOARDING_STATES,
	UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
} from './constants';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
import { HOUR_IN_SECONDS } from '../../../util';

const fetchGetPublicationsStore = createFetchStore( {
	baseName: 'getPublications',
	controlCallback: () =>
		API.get(
			'modules',
			READER_REVENUE_MANAGER_MODULE_SLUG,
			'publications',
			{},
			{ useCache: false }
		),
	reducerCallback: ( state, publications ) => ( { ...state, publications } ),
} );

const baseInitialState = {
	publications: undefined,
};

const baseActions = {
	/**
	 * Syncronizes the onboarding state of the publication with the API.
	 * Updates the settings on the server.
	 *
	 * @since 1.132.0
	 *
	 * @return {void}
	 */
	*syncPublicationOnboardingState() {
		const registry = yield commonActions.getRegistry();
		const connected = yield commonActions.await(
			registry
				.resolveSelect( CORE_MODULES )
				.isModuleConnected( READER_REVENUE_MANAGER_MODULE_SLUG )
		);

		// If the module is not connected, do not attempt to sync the onboarding state.
		if ( ! connected ) {
			return;
		}

		yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getSettings()
		);

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
		if ( ! publications ) {
			return;
		}

		const publication = publications.find(
			// eslint-disable-next-line sitekit/acronym-case
			( { publicationId } ) => publicationId === publicationID
		);

		// If the publication is not found, do not attempt to sync the onboarding state.
		if ( ! publication ) {
			return;
		}

		const { onboardingState } = publication;
		const currentOnboardingState = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationOnboardingState();

		const settings = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getSettings();

		if ( onboardingState !== currentOnboardingState ) {
			settings.publicationOnboardingState = onboardingState;
		}

		// eslint-disable-next-line sitekit/no-direct-date
		settings.publicationOnboardingStateLastSyncedAtMs = Date.now();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setSettings( settings );

		// Save the settings to the API.
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).saveSettings();

		// If the onboarding state is complete, set the key in CORE_UI to trigger the notification.
		if (
			onboardingState ===
			PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
		) {
			registry
				.dispatch( CORE_UI )
				.setValue(
					UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
					true
				);
		}
	},

	/**
	 * Syncronizes the onboarding state of the publication based on the last synced time.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	*maybeSyncPublicationOnboardingState() {
		const registry = yield commonActions.getRegistry();
		const connected = yield commonActions.await(
			registry
				.resolveSelect( CORE_MODULES )
				.isModuleConnected( READER_REVENUE_MANAGER_MODULE_SLUG )
		);

		// If the module is not connected, do not attempt to sync the onboarding state.
		if ( ! connected ) {
			return;
		}

		yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getSettings()
		);

		const onboardingStateLastSyncedAtMs = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationOnboardingStateLastSyncedAtMs();

		if (
			!! onboardingStateLastSyncedAtMs &&
			// The "last synced" value should reflect the real time this action
			// was performed, so we don't use the reference date here.
			Date.now() - onboardingStateLastSyncedAtMs < HOUR_IN_SECONDS * 1000 // eslint-disable-line sitekit/no-direct-date
		) {
			return;
		}

		yield baseActions.syncPublicationOnboardingState();
	},

	/**
	 * Finds a matched publication.
	 *
	 * @since 1.132.0
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
				PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
		);

		return completedOnboardingPublication || publications[ 0 ];
	},

	/**
	 * Resets the publications data in the store.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The dispatched action results.
	 */
	*resetPublications() {
		const registry = yield commonActions.getRegistry();

		yield {
			type: 'RESET_PUBLICATIONS',
		};

		yield errorStoreActions.clearErrors( 'getPublications' );

		return registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.invalidateResolutionForStoreSelector( 'getPublications' );
	},
};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case 'RESET_PUBLICATIONS':
			return {
				...state,
				publications: baseInitialState.publications,
			};
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
			yield baseActions.syncPublicationOnboardingState();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets list of publications associated with the account.
	 *
	 * @since 1.132.0
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
