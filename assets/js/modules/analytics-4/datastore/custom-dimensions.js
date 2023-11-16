/**
 * `modules/analytics-4` data store: custom-dimensions store.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { isValidPropertyID } from '../utils/validation';
import { CUSTOM_DIMENSION_DEFINITIONS, MODULES_ANALYTICS_4 } from './constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_WIDGETS } from '../../../components/KeyMetrics/key-metrics-widgets';

const { createRegistrySelector, createRegistryControl } = Data;

const customDimensionFields = [
	'parameterName',
	'displayName',
	'description',
	'scope',
	'disallowAdsPersonalization',
];

const fetchCreateCustomDimensionStore = createFetchStore( {
	baseName: 'createCustomDimension',
	controlCallback: ( { propertyID, customDimension } ) =>
		API.set( 'modules', 'analytics-4', 'create-custom-dimension', {
			propertyID,
			customDimension,
		} ),
	argsToParams: ( propertyID, customDimension ) => ( {
		propertyID,
		customDimension,
	} ),
	validateParams: ( { propertyID, customDimension } ) => {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
		invariant(
			isPlainObject( customDimension ),
			'Custom dimension must be a plain object.'
		);
		Object.keys( customDimension ).forEach( ( key ) => {
			invariant(
				customDimensionFields.includes( key ),
				`Custom dimension must contain only valid keys. Invalid key: "${ key }"`
			);
		} );
	},
} );

const fetchSyncAvailableCustomDimensionsStore = createFetchStore( {
	baseName: 'syncAvailableCustomDimensions',
	controlCallback: () =>
		API.set( 'modules', 'analytics-4', 'sync-custom-dimensions' ),
	reducerCallback: ( state, dimensions ) => {
		return {
			...state,
			settings: {
				...state.settings,
				availableCustomDimensions: [ ...dimensions ],
			},
		};
	},
} );

const baseInitialState = {
	customDimensionsBeingCreated: [],
	syncTimeoutID: undefined,
};

// Actions
const SET_CUSTOM_DIMENSIONS_BEING_CREATED =
	'SET_CUSTOM_DIMENSIONS_BEING_CREATED';
const SCHEDULE_SYNC_AVAILABLE_CUSTOM_DIMENSIONS =
	'SCHEDULE_SYNC_AVAILABLE_CUSTOM_DIMENSIONS';
const SET_SYNC_TIMEOUT_ID = 'SET_SYNC_TIMEOUT_ID';

const baseActions = {
	/**
	 * Creates custom dimensions and syncs them in the settings.
	 *
	 * @since 1.113.0
	 */
	*createCustomDimensions() {
		const registry = yield Data.commonActions.getRegistry();

		// Wait for the necessary settings to be loaded before checking.
		yield Data.commonActions.await(
			Promise.all( [
				registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings(),
				registry.resolveSelect( CORE_USER ).getKeyMetricsSettings(),
				registry.resolveSelect( CORE_USER ).getUserInputSettings(),
			] )
		);

		const selectedMetricTiles = registry
			.select( CORE_USER )
			.getKeyMetrics();

		// Extract required custom dimensions from selected metric tiles.
		const requiredCustomDimensions = selectedMetricTiles.flatMap(
			( tileName ) => {
				const tile = KEY_METRICS_WIDGETS[ tileName ];
				return tile?.requiredCustomDimensions || [];
			}
		);

		// Deduplicate if any custom dimensions are repeated among tiles.
		const uniqueRequiredCustomDimensions = [
			...new Set( requiredCustomDimensions ),
		];

		const availableCustomDimensions = registry
			.select( MODULES_ANALYTICS_4 )
			.getAvailableCustomDimensions();

		// Find out the missing custom dimensions.
		const missingCustomDimensions = uniqueRequiredCustomDimensions.filter(
			( dimension ) => ! availableCustomDimensions?.includes( dimension )
		);

		// If there are no missing custom dimensions, bail.
		if ( ! missingCustomDimensions.length ) {
			return;
		}

		yield {
			type: SET_CUSTOM_DIMENSIONS_BEING_CREATED,
			payload: { customDimensions: missingCustomDimensions },
		};

		const propertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();

		// Create missing custom dimensions.
		for ( const dimension of missingCustomDimensions ) {
			const dimensionData = CUSTOM_DIMENSION_DEFINITIONS[ dimension ];
			if ( dimensionData ) {
				const { error } =
					yield fetchCreateCustomDimensionStore.actions.fetchCreateCustomDimension(
						propertyID,
						dimensionData
					);

				// If the custom dimension was created successfully, mark it as gathering
				// data immediately so that it doesn't cause unnecessary report requests.
				if ( ! error ) {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveIsCustomDimensionGatheringData(
							dimension,
							true
						);
				}
			}
		}

		// Sync available custom dimensions.
		if ( missingCustomDimensions.length > 0 ) {
			yield fetchSyncAvailableCustomDimensionsStore.actions.fetchSyncAvailableCustomDimensions();
		}

		yield {
			type: SET_CUSTOM_DIMENSIONS_BEING_CREATED,
			payload: { customDimensions: [] },
		};
	},

	/**
	 * Sets a schedule timeout ID for syncing available custom dimensions in state.
	 *
	 * @since 1.114.0
	 *
	 * @param {number} syncTimeoutID The timeout ID.
	 * @return {Object} A redux-style action.
	 */
	setSyncTimeoutID( syncTimeoutID ) {
		return {
			payload: { syncTimeoutID },
			type: SET_SYNC_TIMEOUT_ID,
		};
	},

	/**
	 * Schedules a sync of available custom dimensions in state.
	 *
	 * @since 1.114.0
	 */
	*scheduleSyncAvailableCustomDimensions() {
		yield {
			payload: {},
			type: SCHEDULE_SYNC_AVAILABLE_CUSTOM_DIMENSIONS,
		};
	},
};

export const baseControls = {
	[ SCHEDULE_SYNC_AVAILABLE_CUSTOM_DIMENSIONS ]: createRegistryControl(
		( { select, dispatch } ) =>
			() => {
				const {
					getSyncTimeoutID,
					isFetchingSyncAvailableCustomDimensions,
				} = select( MODULES_ANALYTICS_4 );

				const { fetchSyncAvailableCustomDimensions, setSyncTimeoutID } =
					dispatch( MODULES_ANALYTICS_4 );

				const syncTimeoutID = getSyncTimeoutID();
				const isSyncing = isFetchingSyncAvailableCustomDimensions();

				if ( !! syncTimeoutID ) {
					clearTimeout( syncTimeoutID );

					setSyncTimeoutID( undefined );
				}

				if ( isSyncing ) {
					return;
				}

				const timeoutID = setTimeout( async () => {
					await fetchSyncAvailableCustomDimensions();

					setSyncTimeoutID( undefined );
				}, 2000 );

				setSyncTimeoutID( timeoutID );
			}
	),
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_CUSTOM_DIMENSIONS_BEING_CREATED: {
			return {
				...state,
				customDimensionsBeingCreated: payload.customDimensions,
			};
		}
		case SET_SYNC_TIMEOUT_ID: {
			return {
				...state,
				syncTimeoutID: payload.syncTimeoutID,
			};
		}
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAvailableCustomDimensions() {
		const registry = yield Data.commonActions.getRegistry();

		// Wait for settings to be loaded before proceeding.
		yield Data.commonActions.await(
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		const availableCustomDimensions = registry
			.select( MODULES_ANALYTICS_4 )
			.getAvailableCustomDimensions();

		const isAuthenticated = registry.select( CORE_USER ).isAuthenticated();

		if ( availableCustomDimensions || ! isAuthenticated ) {
			return;
		}

		// Wait for permissions to be loaded before checking if the user can manage options.
		yield Data.commonActions.await(
			registry.resolveSelect( CORE_USER ).getCapabilities()
		);
		const canManageOptions = registry
			.select( CORE_USER )
			.hasCapability( PERMISSION_MANAGE_OPTIONS );

		if ( ! canManageOptions ) {
			return;
		}

		yield fetchSyncAvailableCustomDimensionsStore.actions.fetchSyncAvailableCustomDimensions();
	},
};

const baseSelectors = {
	/**
	 * Checks whether the provided custom dimensions are available.
	 *
	 * @since 1.113.0
	 *
	 * @param {Object}               state            Data store's state.
	 * @param {string|Array<string>} customDimensions Custom dimensions to check.
	 * @return {(boolean|undefined)} True if all provided custom dimensions are available, otherwise false. Undefined if available custom dimensions are not loaded yet.
	 */
	hasCustomDimensions: createRegistrySelector(
		( select ) => ( state, customDimensions ) => {
			// Ensure customDimensions is always an array, even if a string is passed.
			const dimensionsToCheck = Array.isArray( customDimensions )
				? customDimensions
				: [ customDimensions ];

			const availableCustomDimensions =
				select( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions();

			if ( availableCustomDimensions === undefined ) {
				return undefined;
			}

			if ( ! availableCustomDimensions ) {
				return false;
			}

			return dimensionsToCheck.every( ( dimension ) =>
				availableCustomDimensions.includes( dimension )
			);
		}
	),

	/**
	 * Checks whether the provided custom dimension is being created.
	 *
	 * @since 1.113.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} customDimension Custom dimensions to check.
	 * @return {boolean} True the provided custom dimension is being created, otherwise false.
	 */
	isCreatingCustomDimension( state, customDimension ) {
		return !! state?.customDimensionsBeingCreated.includes(
			customDimension
		);
	},

	/**
	 * Returns the error if encountered while creating the provided custom dimension.
	 *
	 * @since 1.113.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} customDimension Custom dimension to obtain creation error for.
	 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
	 */
	getCreateCustomDimensionError: createRegistrySelector(
		( select ) => ( state, customDimension ) => {
			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			return select( MODULES_ANALYTICS_4 ).getErrorForAction(
				'createCustomDimension',
				[ propertyID, CUSTOM_DIMENSION_DEFINITIONS[ customDimension ] ]
			);
		}
	),

	/**
	 * Determines whether the available custom dimensions are being synced.
	 *
	 * @since 1.113.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the available custom dimensions are being synced, otherwise FALSE.
	 */
	isSyncingAvailableCustomDimensions: createRegistrySelector(
		( select ) => ( state ) => {
			return (
				select(
					MODULES_ANALYTICS_4
				).isFetchingSyncAvailableCustomDimensions() ||
				!! state?.syncTimeoutID
			);
		}
	),

	/**
	 * Gets the sync timeout ID from state.
	 *
	 * @since 1.114.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {number|undefined} The timeout ID. Undefined if unset.
	 */
	getSyncTimeoutID( state ) {
		return state?.syncTimeoutID;
	},
};

const store = Data.combineStores(
	fetchCreateCustomDimensionStore,
	fetchSyncAvailableCustomDimensionsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		resolvers: baseResolvers,
		controls: baseControls,
		reducer: baseReducer,
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
