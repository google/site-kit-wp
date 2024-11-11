/**
 * `modules/analytics-4` data store: conversion reporting.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createRegistrySelector,
	createReducer,
} from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { negateDefined } from '../../../util/negate';

function hasConversionReportingEventsOfType( propName ) {
	return createRegistrySelector( ( select ) => () => {
		const inlineData =
			select(
				MODULES_ANALYTICS_4
			).getConversionReportingEventsChange() || {};

		// Here we double-negate the value in order to cast it to a boolean, but only if it's not undefined.
		return negateDefined( negateDefined( inlineData[ propName ]?.length ) );
	} );
}

const dismissNewConversionReportingEventsStore = createFetchStore( {
	baseName: 'dismissNewConversionReportingEvents',
	controlCallback: () => {
		return API.set(
			'modules',
			'analytics-4',
			'clear-conversion-reporting-new-events'
		);
	},
} );

const dismissLostConversionReportingEventsStore = createFetchStore( {
	baseName: 'dismissLostConversionReportingEvents',
	controlCallback: () => {
		return API.set(
			'modules',
			'analytics-4',
			'clear-conversion-reporting-lost-events'
		);
	},
} );

// Actions.
const RECEIVE_CONVERSION_REPORTING_INLINE_DATA =
	'RECEIVE_CONVERSION_REPORTING_INLINE_DATA';

export const initialState = {
	detectedEventsChange: undefined,
};

export const resolvers = {
	*getConversionReportingEventsChange() {
		const registry = yield commonActions.getRegistry();

		if (
			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionReportingEventsChange()
		) {
			return;
		}

		if ( ! global._googlesitekitModulesData ) {
			global.console.error( 'Could not load modules data.' );
			return;
		}

		const { newEvents, lostEvents } =
			global._googlesitekitModulesData[ 'analytics-4' ];

		yield actions.receiveConversionReportingInlineData( {
			newEvents,
			lostEvents,
		} );
	},
};

export const actions = {
	/**
	 * Dismiss new conversion reporting events.
	 *
	 * @since 1.138.0
	 *
	 * @return {boolean} Transient deletion response.
	 */
	dismissNewConversionReportingEvents() {
		return dismissNewConversionReportingEventsStore.actions.fetchDismissNewConversionReportingEvents();
	},

	/**
	 * Dismiss lost conversion reporting events.
	 *
	 * @since 1.138.0
	 *
	 * @return {boolean} Transient deletion response.
	 */
	dismissLostConversionReportingEvents() {
		return dismissLostConversionReportingEventsStore.actions.fetchDismissLostConversionReportingEvents();
	},

	/**
	 * Stores conversion reporting inline data in the datastore.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} data Inline data, usually supplied via a global variable from PHP.
	 * @return {Object} Redux-style action.
	 */
	receiveConversionReportingInlineData( data ) {
		invariant( data, 'data is required.' );

		return {
			payload: { data },
			type: RECEIVE_CONVERSION_REPORTING_INLINE_DATA,
		};
	},
};

export const reducer = createReducer( ( state, { payload, type } ) => {
	switch ( type ) {
		case RECEIVE_CONVERSION_REPORTING_INLINE_DATA: {
			const { newEvents, lostEvents } = payload.data;

			state.detectedEventsChange = { newEvents, lostEvents };
			break;
		}

		default: {
			break;
		}
	}
} );

export const selectors = {
	/**
	 * Checks whether the provided conversion reporting events are available.
	 *
	 * @since 1.135.0
	 *
	 * @param {Object}               state  Data store's state.
	 * @param {string|Array<string>} events Conversion reporting events to check.
	 * @return {(boolean|undefined)} True if all provided custom dimensions are available, otherwise false. Undefined if available custom dimensions are not loaded yet.
	 */
	hasConversionReportingEvents: createRegistrySelector(
		( select ) => ( state, events ) => {
			// Ensure events is always an array, even if a string is passed.
			const eventsToCheck = Array.isArray( events ) ? events : [ events ];

			const detectedEvents =
				select( MODULES_ANALYTICS_4 ).getDetectedEvents();

			if ( ! detectedEvents?.length ) {
				return false;
			}

			return eventsToCheck.some( ( event ) =>
				detectedEvents.includes( event )
			);
		}
	),

	/**
	 * Gets all conversion reporting inline data from this data store.
	 *
	 * Not intended to be used publicly; this is largely here so other selectors can
	 * request data using the selector/resolver pattern.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Conversion reporting inline data.
	 */
	getConversionReportingEventsChange( state ) {
		return state.detectedEventsChange;
	},

	/**
	 * Checks if newEvents are present.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} TRUE if `newEvents` are present, FALSE otherwise.
	 */
	hasNewConversionReportingEvents:
		hasConversionReportingEventsOfType( 'newEvents' ),

	/**
	 * Checks if lostEvents are present.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} TRUE if `lostEvents` are present, FALSE otherwise.
	 */
	hasLostConversionReportingEvents:
		hasConversionReportingEventsOfType( 'lostEvents' ),
};

export default combineStores(
	dismissNewConversionReportingEventsStore,
	dismissLostConversionReportingEventsStore,
	{
		initialState,
		actions,
		resolvers,
		selectors,
		reducer,
	}
);
