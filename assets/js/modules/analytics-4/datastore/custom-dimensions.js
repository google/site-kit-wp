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
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { MODULES_ANALYTICS_4 } from './constants';
// import {
// 	CORE_USER,
// 	PERMISSION_MANAGE_OPTIONS,
// } from '../../../googlesitekit/datastore/user/constants';

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
	controlCallback: ( { propertyID } ) => {
		return API.set( 'modules', 'analytics-4', 'sync-custom-dimensions', {
			propertyID,
		} );
	},
	// reducerCallback: ( state, availableCustomDimensions ) => {
	// 	return {
	// 		...state,
	// 		availableCustomDimensions,
	// 	};
	// },
	argsToParams: ( propertyID ) => ( {
		propertyID,
	} ),
	validateParams: ( { propertyID } ) => {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
	},
} );

const baseInitialState = {};

const baseActions = {
	syncAvailableCustomDimensions: createValidatedAction(
		( propertyID ) => {
			invariant(
				isValidPropertyID( propertyID ),
				'A valid GA4 propertyID is required.'
			);
		},
		function* ( propertyID ) {
			const registry = yield Data.commonActions.getRegistry();
			// const registry = yield Data.commonActions.getRegistry();
			// const existingCustomDimensions = registry
			// 	.select( MODULES_ANALYTICS_4 )
			// 	.getExistingCustomDimensions( propertyID );
			// if ( existingCustomDimensions ) {
			// 	return;
			// }
			const { response } =
				yield fetchSyncAvailableCustomDimensionsStore.actions.fetchSyncAvailableCustomDimensions(
					propertyID
				);

			// Reload the module's settings from the server.
			yield Data.commonActions.await(
				registry.dispatch( MODULES_ANALYTICS_4 ).fetchGetSettings()
			);

			return { response };
		}
	),
};

// const availableCustomDimensions = yield Data.commonActions.await(
// 	registry
// 		.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
// 		.getAvailableCustomDimensions()
// );

// const updatedCustomDimensions = yield Data.commonActions.await(
// 	registry
// 		.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
// 		.getAvailableCustomDimensions()
// );

// const availableCustomDimensions = registry
// 	.select( MODULES_ANALYTICS_4 )
// 	.getAvailableCustomDimensions();

const baseResolvers = {
	*getAvailableCustomDimensions() {
		const registry = yield Data.commonActions.getRegistry();
		// Get the value of the availableCustomDimensions module setting.
		const availableCustomDimensions = yield Data.commonActions.await(
			registry
				.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		);

		global.console.log( { availableCustomDimensions } );

		if ( availableCustomDimensions === null ) {
			const propertyID = registry
				.select( MODULES_ANALYTICS_4 )
				.getPropertyID();
			yield fetchSyncAvailableCustomDimensionsStore.actions.fetchSyncAvailableCustomDimensions(
				propertyID
			);
		}

		// If value is null, check for user authentication and capability.
		// if ( availableCustomDimensions === null ) {
		// 	const isAuthenticated = registry
		// 		.select( CORE_USER )
		// 		.isAuthenticated();
		// 	const canManageOptions = yield Data.commonActions.await(
		// 		registry
		// 			.__experimentalResolveSelect( CORE_USER )
		// 			.hasCapability( PERMISSION_MANAGE_OPTIONS )
		// 	);
		// 	// If conditions are met, dispatch the action to update the setting and wait for it.
		// 	if ( isAuthenticated && canManageOptions ) {
		// 		const propertyID = registry
		// 			.select( MODULES_ANALYTICS_4 )
		// 			.getPropertyID();
		// 		yield fetchSyncAvailableCustomDimensionsStore.actions.fetchSyncAvailableCustomDimensions(
		// 			propertyID
		// 		);

		// 		// After dispatching, get the updated value.
		// 		// const updatedCustomDimensions = registry
		// 		// 	.select( MODULES_ANALYTICS_4 )
		// 		// 	.getAvailableCustomDimensions();

		// 		// return updatedCustomDimensions;
		// 	}
		// }

		// Default: return the module setting value.
		// return availableCustomDimensions;
	},
};

const baseSelectors = {
	hasCustomDimensions: createRegistrySelector(
		( select ) => ( state, customDimensions ) => {
			// Ensure customDimensions is always an array, even if a string is passed.
			const dimensionsToCheck = Array.isArray( customDimensions )
				? customDimensions
				: [ customDimensions ];

			// Retrieve the available custom dimensions using the getAvailableCustomDimensions selector.
			const availableCustomDimensions =
				select( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions();

			// If there are no available custom dimensions, return false.
			if ( ! availableCustomDimensions ) {
				return false;
			}

			// Check if all requested custom dimensions are available.
			return dimensionsToCheck.every( ( dimension ) =>
				availableCustomDimensions.includes( dimension )
			);
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
