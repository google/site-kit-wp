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
import compareVersions from 'compare-versions';
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { STORE_NAME } from './constants';
import featureTours from '../../../feature-tours';
import { setItem, getItem } from '../../../googlesitekit/api/cache';
import { createValidatedAction } from '../../data/utils';

const { createRegistrySelector, createRegistryControl } = Data;
const { getRegistry } = Data.commonActions;

// Feature tour cooldown period is 2 hours
export const FEATURE_TOUR_COOLDOWN_SECONDS = 60 * 60 * 2;
export const FEATURE_TOUR_LAST_DISMISSED_AT = 'feature_tour_last_dismissed_at';

// Actions.
const DISMISS_TOUR = 'DISMISS_TOUR';
const RECEIVE_READY_TOURS = 'RECEIVE_READY_TOURS';
const RECEIVE_TOURS = 'RECEIVE_TOURS';
const CHECK_TOUR_REQUIREMENTS = 'CHECK_TOUR_REQUIREMENTS';
const RECEIVE_LAST_DISMISSED_AT = 'RECEIVE_LAST_DISMISSED_AT';

// Controls.
const CACHE_LAST_DISMISSED_AT = 'CACHE_LAST_DISMISSED_AT';

const fetchGetDismissedToursStore = createFetchStore( {
	baseName: 'getDismissedTours',
	controlCallback: () => API.get( 'core', 'user', 'dismissed-tours', {}, { useCache: false } ),
	reducerCallback: ( state, dismissedTourSlugs ) => ( { ...state, dismissedTourSlugs } ),
} );

const fetchDismissTourStore = createFetchStore( {
	baseName: 'dismissTour',
	controlCallback: ( { slug } ) => API.set( 'core', 'user', 'dismiss-tour', { slug } ),
	reducerCallback: ( state, dismissedTourSlugs ) => ( { ...state, dismissedTourSlugs } ),
	argsToParams: ( slug ) => ( { slug } ),
	validateParams: ( { slug } = {} ) => {
		invariant( slug, 'slug is required.' );
	},
} );

const baseInitialState = {
	lastDismissedAt: undefined,
	// Array of dismissed tour slugs.
	dismissedTourSlugs: undefined,
	// Array of tour objects.
	tours: featureTours,
	// Map of [viewContext]: ordered array of tour objects.
	viewTours: {},
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
	dismissTour: createValidatedAction(
		( slug ) => {
			invariant( slug, 'A tour slug is required to dismiss a tour.' );
		},
		function*( slug ) {
			const { select } = yield getRegistry();

			if ( select( STORE_NAME ).isFetchingDismissTour( slug ) ) {
				const response = select( STORE_NAME ).getDismissedFeatureTourSlugs();
				return { response, error: undefined };
			}

			// Dismiss the given tour immediately.
			yield {
				type: DISMISS_TOUR,
				payload: { slug },
			};

			// Save the timestamp to allow the cooldown
			yield actions.setLastDismissedAt( Date.now() );

			// Dispatch a request to persist and receive updated dismissed tours.
			return yield fetchDismissTourStore.actions.fetchDismissTour( slug );
		},
	),

	receiveFeatureToursForView( viewTours, { viewContext } = {} ) {
		invariant( Array.isArray( viewTours ), 'viewTours must be an array.' );
		invariant( viewContext, 'viewContext is required.' );
		return {
			payload: { viewTours, viewContext },
			type: RECEIVE_READY_TOURS,
		};
	},

	receiveAllFeatureTours( tours ) {
		invariant( Array.isArray( tours ), 'tours must be an array.' );
		return {
			payload: { tours },
			type: RECEIVE_TOURS,
		};
	},

	receiveLastDismissedAt( timestamp ) {
		invariant( timestamp !== undefined, 'A timestamp is required.' );
		return {
			type: RECEIVE_LAST_DISMISSED_AT,
			payload: {
				timestamp,
			},
		};
	},

	setLastDismissedAt: createValidatedAction(
		( timestamp ) => {
			invariant( timestamp, 'A timestamp is required.' );
		},
		function*( timestamp ) {
			yield {
				type: CACHE_LAST_DISMISSED_AT,
				payload: { timestamp },
			};
			yield {
				type: RECEIVE_LAST_DISMISSED_AT,
				payload: { timestamp },
			};
		},
	),
};

const baseControls = {
	[ CHECK_TOUR_REQUIREMENTS ]: createRegistryControl( ( registry ) => async ( { payload } ) => {
		const { tour, viewContext } = payload;

		// Check the view context.
		if ( ! tour.contexts.includes( viewContext ) ) {
			return false;
		}

		// Only tours with a version after a user's initial Site Kit version should qualify.
		const initialVersion = registry.select( STORE_NAME ).getInitialSiteKitVersion();
		if ( ! initialVersion ) {
			return false;
		} else if ( compareVersions.compare( initialVersion, tour.version, '>=' ) ) {
			return false;
		}

		// Check if the tour has already been dismissed.
		// Here we need to first await the underlying selector with the asynchronous resolver.
		await registry.__experimentalResolveSelect( STORE_NAME ).getDismissedFeatureTourSlugs();
		if ( registry.select( STORE_NAME ).isTourDismissed( tour.slug ) ) {
			return false;
		}

		// If the tour has additional requirements, check those as well.
		if ( tour.checkRequirements ) {
			return !! await tour.checkRequirements( registry );
		}

		return true;
	} ),
	[ CACHE_LAST_DISMISSED_AT ]: async ( { payload } ) => {
		const { timestamp } = payload;

		await setItem( FEATURE_TOUR_LAST_DISMISSED_AT, timestamp, {
			ttl: FEATURE_TOUR_COOLDOWN_SECONDS,
		} );
	},
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case DISMISS_TOUR: {
			const { slug } = payload;
			const { dismissedTourSlugs = [] } = state;
			if ( dismissedTourSlugs.includes( slug ) ) {
				return state;
			}
			return {
				...state,
				dismissedTourSlugs: dismissedTourSlugs.concat( slug ),
			};
		}

		case RECEIVE_READY_TOURS: {
			const { viewContext, viewTours } = payload;
			return {
				...state,
				viewTours: {
					...state.viewTours,
					[ viewContext ]: viewTours,
				},
			};
		}

		case RECEIVE_TOURS: {
			return {
				...state,
				tours: payload.tours,
			};
		}

		case RECEIVE_LAST_DISMISSED_AT: {
			return {
				...state,
				lastDismissedAt: payload.timestamp,
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getDismissedFeatureTourSlugs() {
		const { select } = yield getRegistry();

		const tours = select( STORE_NAME ).getDismissedFeatureTourSlugs();
		if ( tours === undefined ) {
			yield fetchGetDismissedToursStore.actions.fetchGetDismissedTours();
		}
	},

	*getFeatureToursForView( viewContext ) {
		const registry = yield getRegistry();
		const tours = registry.select( STORE_NAME ).getAllFeatureTours();
		const viewTours = [];

		for ( const tour of tours ) {
			const tourQualifies = yield {
				payload: { tour, viewContext },
				type: CHECK_TOUR_REQUIREMENTS,
			};

			if ( tourQualifies ) {
				viewTours.push( tour );
			}
		}
		yield actions.receiveFeatureToursForView( viewTours, { viewContext } );
	},

	*getLastDismissedAt() {
		const { value: lastDismissedAt } = yield Data.commonActions.await( getItem( FEATURE_TOUR_LAST_DISMISSED_AT ) );

		yield actions.receiveLastDismissedAt( lastDismissedAt || null );
	},
};

const baseSelectors = {
	/**
	 * Gets the list of dismissed tour slugs.
	 *
	 * @since 1.27.0
	 * @since 1.29.0 Renamed from getDismissedTours.
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string[]|undefined)} Array of dismissed tour slugs,
	 *                                `undefined` if not resolved yet.
	 */
	getDismissedFeatureTourSlugs( state ) {
		return state.dismissedTourSlugs;
	},

	/**
	 * Gets a list of tour objects that qualify for the given view context.
	 *
	 * @since 1.29.0
	 *
	 * @param {Object} state       Data store's state.
	 * @param {string} viewContext View context.
	 * @return {(Object[]|undefined)} Array of qualifying tour objects
	 *                                `undefined` while readiness is being resolved.
	 */
	getFeatureToursForView( state, viewContext ) {
		return state.viewTours[ viewContext ];
	},

	/**
	 * Gets a list of all tour objects.
	 *
	 * @since 1.29.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object[]} Array of tour objects.
	 */
	getAllFeatureTours( state ) {
		return state.tours;
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
		const dismissedTourSlugs = select( STORE_NAME ).getDismissedFeatureTourSlugs();

		if ( undefined === dismissedTourSlugs ) {
			return undefined;
		}

		return dismissedTourSlugs.includes( slug );
	} ),

	/**
	 * Gets the timestamp for the last dismissed feature tour.
	 *
	 * @since 1.29.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|null|undefined)} Timestamp of the last dismissal
	 *                                   `null` if no timestamp exists
	 *                                    or `undefined` if value is unresolved.
	 */
	getLastDismissedAt( state ) {
		return state.lastDismissedAt;
	},

	/**
	 * Determines whether feature tours are on cooldown (i.e. the last
	 * dismissal was within the cooldown time span).
	 *
	 * @since 1.29.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {undefined|boolean} Whether feature tours are on cooldown or undefined.
	 */
	areFeatureToursOnCooldown: createRegistrySelector( ( select ) => () => {
		const lastDismissedAt = select( STORE_NAME ).getLastDismissedAt();

		if ( undefined === lastDismissedAt ) {
			return undefined;
		}
		// If null, there is no value in the cache, or it has expired.
		if ( null === lastDismissedAt ) {
			return false;
		}

		const coolDownPeriodMilliseconds = FEATURE_TOUR_COOLDOWN_SECONDS * 1000;
		const coolDownExpiresAt = lastDismissedAt + coolDownPeriodMilliseconds;

		return Date.now() < coolDownExpiresAt;
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

