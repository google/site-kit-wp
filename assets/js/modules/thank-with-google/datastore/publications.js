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
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
import {
	MODULES_THANK_WITH_GOOGLE,
	ONBOARDING_STATE_COMPLETE,
} from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

const { createRegistrySelector } = Data;

// Actions
const RESET_PUBLICATIONS = 'RESET_PUBLICATIONS';

const fetchGetPublicationsStore = createFetchStore( {
	baseName: 'getPublications',
	storeName: MODULES_THANK_WITH_GOOGLE,
	controlCallback: () => {
		return API.get( 'modules', 'thank-with-google', 'publications', null, {
			useCache: false,
		} );
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

const baseActions = {
	*resetPublications() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			type: RESET_PUBLICATIONS,
			payload: {},
		};

		yield errorStoreActions.clearErrors( 'getPublications' );

		return dispatch(
			MODULES_THANK_WITH_GOOGLE
		).invalidateResolutionForStoreSelector( 'getPublications' );
	},
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_PUBLICATIONS: {
			return {
				...state,
				publications: baseInitialState.publications,
			};
		}

		default: {
			return state;
		}
	}
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
	 * @since 1.79.0
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
	 * - If the `publicationID` module setting is already set and that publication is in the list.
	 * - Otherwise, if any of the publications has its `onboardingState` field set to `ONBOARDING_COMPLETE`.
	 * - Otherwise, returns the first one in the list.
	 *
	 * @since 1.79.0
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

		if ( ! publications?.length ) {
			return null;
		}

		const publicationID = select(
			MODULES_THANK_WITH_GOOGLE
		).getPublicationID();

		return (
			// eslint-disable-next-line sitekit/acronym-case
			publications.find( ( p ) => p.publicationId === publicationID ) ||
			publications.find(
				( p ) => p.onboardingState === ONBOARDING_STATE_COMPLETE
			) ||
			publications[ 0 ]
		);
	} ),

	/**
	 * Gets the link to create new publication.
	 *
	 * @since n.e.x.t
	 *
	 * @return {string} Create publication URL.
	 */
	getServiceCreatePublicationURL: createRegistrySelector(
		( select ) => () => {
			const homeURL = select( CORE_SITE ).getHomeURL();

			const url = new URL( 'https://publishercenter.google.com/' );
			url.searchParams.set( 'sk_url', encodeURIComponent( homeURL ) );

			return select( CORE_USER ).getAccountChooserURL( url.toString() );
		}
	),

	/**
	 * Gets the link of an existing publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} _state        Data store's state.
	 * @param {string} publicationID The ID of the publication to get link for.
	 * @return {string} Publication link.
	 */
	getServicePublicationURL: ( _state, publicationID ) => {
		return `https://publishercenter.google.com/publications/${ publicationID }/overview`;
	},
};

const store = Data.combineStores( fetchGetPublicationsStore, {
	initialState: baseInitialState,
	actions: baseActions,
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
