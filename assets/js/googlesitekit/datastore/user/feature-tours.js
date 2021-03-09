/**
 * `core/user` data store: feature tours
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { STORE_NAME } from './constants';
import { baseControls } from '../../modules/datastore/modules';
import featureTours from '../../../feature-tours';
const { createRegistrySelector } = Data;

// Actions.
const DISMISS_TOUR = 'DISMISS_TOUR';

const fetchGetDismissedToursStore = createFetchStore( {
	baseName: 'getDismissedTours',
	controlCallback: () => {
		return API.get( 'core', 'user', 'dismissed-tours', {}, { useCache: false } );
	},
	reducerCallback: ( state, dismissedTours ) => {
		return {
			...state,
			dismissedTours,
		};
	},
} );
const { fetchGetDismissedTours, receiveGetDismissedTours } = fetchGetDismissedToursStore.actions;
const fetchDismissTourStore = createFetchStore( {
	baseName: 'dismissTour',
	controlCallback: ( { slug } ) => API.set( 'core', 'user', 'dismiss-tour', { slug } ),
	reducerCallback: ( state, dismissedTours ) => {
		return {
			...state,
			dismissedTours,
		};
	},
	argsToParams: ( slug ) => ( { slug } ),
	validateParams: ( { slug } = {} ) => {
		invariant( slug, 'slug is required.' );
	},
} );
const { fetchDismissTour } = fetchDismissTourStore.actions;

const baseInitialState = {
	dismissedTours: undefined,
	tours: featureTours,
};

const baseActions = {
	/**
	 * Dismisses the given tour by slug.
	 *
	 * @since 1.27.0
	 *
	 * @param {string} slug Tour slug to dismiss.
	 * @return {Object} Generator instance.
	 */
	dismissTour( slug ) {
		invariant( slug, 'A tour slug is required to dismiss a tour.' );

		return ( function* () {
			// Dismiss the given tour immediately.
			yield {
				payload: { slug },
				type: DISMISS_TOUR,
			};
			// Dispatch a request to persist the dismissal.
			const { response, error } = yield fetchDismissTour( slug );
			if ( ! error ) {
				yield receiveGetDismissedTours( response );
			}
			return { response, error };
		}() );
	},
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case DISMISS_TOUR: {
			const { slug } = payload;
			const { dismissedTours = [] } = state;
			if ( dismissedTours.includes( slug ) ) {
				return state;
			}
			return {
				...state,
				dismissedTours: dismissedTours.concat( slug ),
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getDismissedTours() {
		const { select } = yield Data.commonActions.getRegistry();
		if ( ! select( STORE_NAME ).getDismissedTours() ) {
			const { response, error } = yield fetchGetDismissedTours();
			if ( ! error ) {
				yield receiveGetDismissedTours( response );
			}
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the list of dismissed tours.
	 *
	 * @since 1.27.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string[]|undefined)} Array of dismissed tour slugs,
	 *                                `undefined` if not resolved yet.
	 */
	getDismissedTours( state ) {
		return state.dismissedTours;
	},

	/**
	 * Checks whether or not the given tour is dismissed.
	 *
	 * @since 1.27.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Tour slug to check.
	 * @return {(boolean|undefined)} `undefined` if dismissed tours are not loaded yet,
	 *                               `true` if dismissed,
	 *                               `false` if not dismissed.
	 */
	isTourDismissed: createRegistrySelector( ( select ) => ( state, slug ) => {
		const dismissedTours = select( STORE_NAME ).getDismissedTours();

		if ( undefined === dismissedTours ) {
			return undefined;
		}

		return dismissedTours.includes( slug );
	} ),
};

export const {
	actions,
	controls,
	initialState,
	reducer,
	resolvers,
	selectors,
} = Data.combineStores(
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	},
	fetchDismissTourStore,
	fetchGetDismissedToursStore,
);

export default {
	actions,
	controls,
	initialState,
	reducer,
	resolvers,
	selectors,
};
