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
import { get, set } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
	createRegistryControl,
	createRegistrySelector,
} from 'googlesitekit-data';
import { KEY_METRICS_WIDGETS } from '@/js/components/KeyMetrics/key-metrics-widgets';
import { isFeatureEnabled } from '@/js/features';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { isValidPropertyID } from '@/js/modules/analytics-4/utils/validation';
import {
	CUSTOM_DIMENSION_DEFINITIONS,
	MODULES_ANALYTICS_4,
	SITE_GOALS_CUSTOM_DIMENSIONS,
} from './constants';

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
		set( 'modules', MODULE_SLUG_ANALYTICS_4, 'create-custom-dimension', {
			propertyID,
			customDimension,
		} ),
	reducerCallback: createReducer(
		( state, createdCustomDimension, { propertyID } ) => {
			const parameterName = createdCustomDimension?.parameterName;
			const propertyCustomDimensions =
				state.propertyCustomDimensions?.[ propertyID ];

			// Append the new dimension only when the property's list is already
			// loaded. Otherwise the `getCustomDimensions` resolver loads it in full.
			if (
				! parameterName ||
				! propertyCustomDimensions ||
				propertyCustomDimensions.includes( parameterName )
			) {
				return;
			}

			propertyCustomDimensions.push( parameterName );
		}
	),
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
	isAction: true,
} );

const fetchSyncAvailableCustomDimensionsStore = createFetchStore( {
	baseName: 'syncAvailableCustomDimensions',
	controlCallback: () =>
		set( 'modules', MODULE_SLUG_ANALYTICS_4, 'sync-custom-dimensions' ),
	reducerCallback: createReducer( ( state, dimensions ) => {
		state.settings = state.settings || {};
		state.settings.availableCustomDimensions = dimensions;

		// The `sync-custom-dimensions` request saves `availableCustomDimensions`
		// on the server, so set it on `savedSettings` too. The form compares
		// `settings` and `savedSettings` to know if there are unsaved changes.
		// Without this, it would see the synced value as unsaved, and Cancel
		// would drop it until the next page load.
		state.savedSettings = state.savedSettings || {};
		state.savedSettings.availableCustomDimensions = dimensions;
	} ),
	isAction: true,
} );

const fetchGetCustomDimensionsStore = createFetchStore( {
	baseName: 'getCustomDimensions',
	controlCallback: ( { propertyID } ) =>
		get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'custom-dimensions',
			{ propertyID },
			{ useCache: false }
		),
	reducerCallback: createReducer( ( state, dimensions, { propertyID } ) => {
		state.propertyCustomDimensions = state.propertyCustomDimensions || {};
		state.propertyCustomDimensions[ propertyID ] = dimensions;
	} ),
	argsToParams: ( propertyID ) => ( { propertyID } ),
	validateParams: ( { propertyID } = {} ) => {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
	},
} );

const baseInitialState = {
	customDimensionsBeingCreated: [],
	propertyCustomDimensions: {},
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
	 * @since 1.181.0 Added the Site Goals custom dimensions when the `siteGoals` feature flag is on and advanced data breakdowns is enabled.
	 * @since 1.182.0 Created the missing custom dimensions on the selected property, and added the Site Goals dimensions only when advanced data breakdowns is enabled for that property.
	 *
	 * @param {Array<string>} customDimensions Optional additional custom dimensions to create.
	 * @return {Object} Object whose `error` property holds the available-dimensions sync error when the required dimensions already existed and that sync failed; otherwise an empty object.
	 */
	*createCustomDimensions( customDimensions = [] ) {
		const registry = yield commonActions.getRegistry();

		// Wait for the necessary settings to be loaded before checking.
		yield commonActions.await(
			Promise.all( [
				registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings(),
				registry.resolveSelect( CORE_USER ).getKeyMetricsSettings(),
				registry.resolveSelect( CORE_USER ).getUserInputSettings(),
			] )
		);

		const propertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();

		// Custom dimensions are created on the selected property, so there's
		// nothing to create until a valid property is selected.
		if ( ! isValidPropertyID( propertyID ) ) {
			return {};
		}

		const selectedMetricTiles = registry
			.select( CORE_USER )
			.getKeyMetrics();

		// Extract required custom dimensions from selected metric tiles.
		const keyMetricsRequiredCustomDimensions = selectedMetricTiles.flatMap(
			( tileName ) => {
				const tile = KEY_METRICS_WIDGETS[ tileName ];
				return tile?.requiredCustomDimensions || [];
			}
		);
		const requiredCustomDimensions = [
			...keyMetricsRequiredCustomDimensions,
			...( Array.isArray( customDimensions ) ? customDimensions : [] ),
		];

		// Deduplicate if any custom dimensions are repeated among tiles.
		const uniqueRequiredCustomDimensions = [
			...new Set( requiredCustomDimensions ),
		];

		// Add the Site Goals custom dimensions when the Site Goals feature is on
		// and advanced data breakdowns is enabled for the selected property. The
		// breakdowns setting is read only inside this check, so flows with the
		// feature off, like key metrics setup, never request it.
		if ( isFeatureEnabled( 'siteGoals' ) ) {
			const isAdvancedDataBreakdownsEnabled = registry
				.select( MODULES_ANALYTICS_4 )
				.isAdvancedDataBreakdownsEnabled( propertyID );

			if ( isAdvancedDataBreakdownsEnabled ) {
				SITE_GOALS_CUSTOM_DIMENSIONS.forEach( ( dimension ) => {
					if (
						! uniqueRequiredCustomDimensions.includes( dimension )
					) {
						uniqueRequiredCustomDimensions.push( dimension );
					}
				} );
			}
		}

		// If no custom dimensions are required, there's nothing to create.
		if ( ! uniqueRequiredCustomDimensions.length ) {
			return {};
		}

		/**
		 * The selected property's custom dimensions, read from the property
		 * itself, not from the saved `availableCustomDimensions`, which only
		 * holds the dimensions of the property saved in settings.
		 */
		// A finished resolver won't refetch, so a retry would reuse the stale
		// error (e.g. missing GA4 permission). Invalidate first to force a
		// fresh fetch that clears it.
		const hasLoadError = registry
			.select( MODULES_ANALYTICS_4 )
			.getCustomDimensionsError( propertyID );

		if ( hasLoadError ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getCustomDimensions', [ propertyID ] );
		}

		const propertyCustomDimensions = yield commonActions.await(
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getCustomDimensions( propertyID )
		);

		// Stop when the property's dimensions didn't load. Without the list, we
		// can't tell which are missing, so creating them could add ones that
		// already exist.
		if ( ! Array.isArray( propertyCustomDimensions ) ) {
			return {};
		}

		// Find out the missing custom dimensions.
		const missingCustomDimensions = uniqueRequiredCustomDimensions.filter(
			( dimension ) => ! propertyCustomDimensions.includes( dimension )
		);

		// No missing dimensions: the required ones already exist. Sync the saved
		// `availableCustomDimensions` (which drives the success notice, not the
		// property read) and return any sync error — a failed sync leaves the
		// setting stale, so the notice can't render.
		if ( ! missingCustomDimensions.length ) {
			const { error } =
				yield fetchSyncAvailableCustomDimensionsStore.actions.fetchSyncAvailableCustomDimensions();
			return { error };
		}

		yield {
			type: SET_CUSTOM_DIMENSIONS_BEING_CREATED,
			payload: { customDimensions: missingCustomDimensions },
		};

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
						.receiveIsCustomDimensionGatheringData( {
							customDimension: dimension,
							gatheringData: true,
						} );
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

		return {};
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

export const baseReducer = createReducer( ( state, action ) => {
	switch ( action.type ) {
		case SET_CUSTOM_DIMENSIONS_BEING_CREATED: {
			state.customDimensionsBeingCreated =
				action.payload.customDimensions;
			break;
		}

		case SET_SYNC_TIMEOUT_ID: {
			state.syncTimeoutID = action.payload.syncTimeoutID;
			break;
		}

		default:
			break;
	}
} );

const baseResolvers = {
	*getAvailableCustomDimensions() {
		const { select, resolveSelect } = yield commonActions.getRegistry();
		const { isAuthenticated, hasCapability } = select( CORE_USER );

		const isGA4Connected = yield commonActions.await(
			resolveSelect( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			)
		);

		if ( ! isGA4Connected ) {
			return;
		}

		// Wait for settings to be loaded before proceeding.
		yield commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		const availableCustomDimensions =
			select( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions();

		if ( availableCustomDimensions || ! isAuthenticated() ) {
			return;
		}

		// Wait for permissions to be loaded before checking if the user can manage options.
		yield commonActions.await(
			resolveSelect( CORE_USER ).getCapabilities()
		);

		if ( ! hasCapability( PERMISSION_MANAGE_OPTIONS ) ) {
			return;
		}

		yield fetchSyncAvailableCustomDimensionsStore.actions.fetchSyncAvailableCustomDimensions();
	},

	*getCustomDimensions( propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const registry = yield commonActions.getRegistry();

		const propertyCustomDimensions = registry
			.select( MODULES_ANALYTICS_4 )
			.getCustomDimensions( propertyID );

		if ( propertyCustomDimensions === undefined ) {
			yield fetchGetCustomDimensionsStore.actions.fetchGetCustomDimensions(
				propertyID
			);
		}
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

			if (
				availableCustomDimensions === undefined ||
				availableCustomDimensions === null
			) {
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
	 * Gets the Site Kit custom dimensions available on the given property.
	 *
	 * Unlike `getAvailableCustomDimensions`, this reads any property's
	 * dimensions, so it works for a property selected in a form but not yet
	 * saved in settings.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID GA4 property ID to get the custom dimensions for.
	 * @return {(Array.<string>|undefined)} List of `googlesitekit_`-prefixed parameter names, or undefined if they aren't loaded yet.
	 */
	getCustomDimensions( state, propertyID ) {
		return state.propertyCustomDimensions?.[ propertyID ];
	},

	/**
	 * Checks whether the given property has all the provided custom dimensions.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object}               state            Data store's state.
	 * @param {string}               propertyID       GA4 property ID to check the custom dimensions on.
	 * @param {string|Array<string>} customDimensions Custom dimensions to check.
	 * @return {(boolean|undefined)} True if the property has all the provided dimensions, false if not. Undefined if they aren't loaded yet.
	 */
	hasCustomDimensionsForProperty: createRegistrySelector(
		( select ) => ( state, propertyID, customDimensions ) => {
			/**
			 * The dimensions to check, as an array even when the caller passes
			 * a single string.
			 */
			const dimensionsToCheck = Array.isArray( customDimensions )
				? customDimensions
				: [ customDimensions ];

			const propertyCustomDimensions =
				select( MODULES_ANALYTICS_4 ).getCustomDimensions( propertyID );

			if ( propertyCustomDimensions === undefined ) {
				return undefined;
			}

			return dimensionsToCheck.every( ( dimension ) =>
				propertyCustomDimensions.includes( dimension )
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
	 * Returns the error encountered while loading the property's custom dimensions.
	 *
	 * Custom dimension creation aborts early when this load fails (e.g. the user
	 * lacks permission on the GA4 property), before any create error is recorded,
	 * so this exposes that earlier failure.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID GA4 property ID to obtain the load error for.
	 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
	 */
	getCustomDimensionsError: createRegistrySelector(
		( select ) => ( state, propertyID ) => {
			return select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getCustomDimensions',
				[ propertyID ]
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

const store = combineStores(
	fetchCreateCustomDimensionStore,
	fetchSyncAvailableCustomDimensionsStore,
	fetchGetCustomDimensionsStore,
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
