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

const { createRegistrySelector } = Data;

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
};

// Actions
const SET_CUSTOM_DIMENSIONS_BEING_CREATED =
	'SET_CUSTOM_DIMENSIONS_BEING_CREATED';

const baseActions = {
	/**
	 * Creates custom dimensions and syncs them in the settings.
	 *
	 * @since n.e.x.t
	 */
	*createCustomDimensions() {
		const registry = yield Data.commonActions.getRegistry();

		// Wait for the necessary settings to be loaded before checking.
		yield Data.commonActions.await(
			Promise.all( [
				registry
					.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
					.getSettings(),
				registry
					.__experimentalResolveSelect( CORE_USER )
					.getKeyMetricsSettings(),
				registry
					.__experimentalResolveSelect( CORE_USER )
					.getUserInputSettings(),
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
				yield fetchCreateCustomDimensionStore.actions.fetchCreateCustomDimension(
					propertyID,
					dimensionData
				);
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
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_CUSTOM_DIMENSIONS_BEING_CREATED: {
			return {
				...state,
				customDimensionsBeingCreated: payload.customDimensions,
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

		const availableCustomDimensions = registry
			.select( MODULES_ANALYTICS_4 )
			.getAvailableCustomDimensions();

		const isAuthenticated = registry.select( CORE_USER ).isAuthenticated();

		if ( availableCustomDimensions || ! isAuthenticated ) {
			return;
		}

		// Wait for permissions to be loaded before checking if the user can manage options.
		yield Data.commonActions.await(
			registry.__experimentalResolveSelect( CORE_USER ).getCapabilities()
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the available custom dimensions are being synced, otherwise FALSE.
	 */
	isSyncingAvailableCustomDimensions: createRegistrySelector(
		( select ) => () => {
			return select(
				MODULES_ANALYTICS_4
			).isFetchingSyncAvailableCustomDimensions();
		}
	),
};

const store = Data.combineStores(
	fetchCreateCustomDimensionStore,
	fetchSyncAvailableCustomDimensionsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		resolvers: baseResolvers,
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
