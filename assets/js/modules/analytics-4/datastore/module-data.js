/**
 * `modules/analytics-4` data store: module data.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createReducer, createRegistrySelector } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../constants';

function getModuleDataProperty( propName ) {
	return createRegistrySelector( ( select ) => () => {
		const moduleData = select( MODULES_ANALYTICS_4 ).getModuleData() || [];
		return moduleData[ propName ];
	} );
}

const RECEIVE_MODULE_DATA = 'RECEIVE_MODULE_DATA';

export const initialState = {
	moduleData: {
		newEvents: undefined,
		lostEvents: undefined,
		newBadgeEvents: undefined,
		hasMismatchedTag: undefined,
		isWebDataStreamAvailable: undefined,
		resourceAvailabilityDates: undefined,
	},
};

export const actions = {
	/**
	 * Stores conversion reporting inline data in the datastore.
	 *
	 * @since 1.148.0
	 * @private
	 *
	 * @param {Object} data Inline data, usually supplied via a global variable from PHP.
	 * @return {Object} Redux-style action.
	 */
	receiveModuleData( data ) {
		invariant( data, 'data is required.' );

		return {
			payload: data,
			type: RECEIVE_MODULE_DATA,
		};
	},
};

export const reducer = createReducer( ( state, { payload, type } ) => {
	switch ( type ) {
		case RECEIVE_MODULE_DATA: {
			const {
				tagIDMismatch,
				resourceAvailabilityDates,
				customDimensionsDataAvailable,
				newEvents,
				lostEvents,
				newBadgeEvents,
				isWebDataStreamAvailable,
			} = payload;

			// Replace empty array value with empty object in resourceAvailabilityDates object.
			Object.keys( resourceAvailabilityDates || {} ).forEach( ( key ) => {
				if ( Array.isArray( resourceAvailabilityDates[ key ] ) ) {
					resourceAvailabilityDates[ key ] = {};
				}
			} );

			const moduleData = {
				hasMismatchedTag: !! tagIDMismatch,
				resourceAvailabilityDates,
				customDimensionsDataAvailable,
				newEvents,
				lostEvents,
				newBadgeEvents,
				isWebDataStreamAvailable,
			};

			state.moduleData = moduleData;
			break;
		}

		default: {
			return state;
		}
	}
} );

export const resolvers = {
	*getModuleData() {
		const moduleData =
			global._googlesitekitModulesData?.[ MODULE_SLUG_ANALYTICS_4 ];

		if ( ! moduleData ) {
			return;
		}

		yield actions.receiveModuleData( moduleData );
	},
};

export const selectors = {
	/**
	 * Gets all module data from this data store.
	 *
	 * Not intended to be used publicly; this is largely here so other selectors can
	 * request data using the selector/resolver pattern.
	 *
	 * @since 1.148.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Module data.
	 */
	getModuleData( state ) {
		return state.moduleData;
	},

	/**
	 * Checks if GA4 has mismatched Google Tag ID.
	 *
	 * @since 1.96.0
	 * @since 1.148.0 Moved over from properties data store partial.
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} If GA4 has mismatched Google Tag ID.
	 */
	hasMismatchedGoogleTagID: getModuleDataProperty( 'hasMismatchedTag' ),

	/**
	 * Gets the data availability date for all resources.
	 *
	 * @since 1.127.0
	 * @since n.e.x.t Moved over from partial-data store partial.
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Resource data availability dates. Undefined if not loaded.
	 */
	getResourceDataAvailabilityDates: getModuleDataProperty(
		'resourceAvailabilityDates'
	),

	/**
	 * Gets the custom dimensions data availability object.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Object mapping custom dimension slugs to their data availability state.
	 */
	getCustomDimensionsDataAvailable: getModuleDataProperty(
		'customDimensionsDataAvailable'
	),

	/**
	 * Gets new events data.
	 *
	 * @since 1.148.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} New events array.
	 */
	getNewEvents: getModuleDataProperty( 'newEvents' ),

	/**
	 * Gets lost events data.
	 *
	 * @since 1.148.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} Lost events array.
	 */
	getLostEvents: getModuleDataProperty( 'lostEvents' ),

	/**
	 * Gets new badge events data.
	 *
	 * @since 1.148.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} New badge events array.
	 */
	getNewBadgeEvents: getModuleDataProperty( 'newBadgeEvents' ),

	/**
	 * Checks if the Web Data Stream is available.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} TRUE if the Web Data Stream is available, FALSE if not, undefined if not loaded.
	 */
	isWebDataStreamAvailable: getModuleDataProperty(
		'isWebDataStreamAvailable'
	),
};

export default {
	initialState,
	actions,
	reducer,
	resolvers,
	selectors,
};
