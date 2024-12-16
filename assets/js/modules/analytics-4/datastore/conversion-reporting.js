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
import { isEqual } from 'lodash';

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
import {
	CORE_USER,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
} from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from './constants';
import { USER_INPUT_PURPOSE_TO_CONVERSION_EVENTS_MAPPING } from '../../../components/user-input/util/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { negateDefined } from '../../../util/negate';
import { safelySort } from '../../../util';

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
	reducerCallback: ( state, values ) => {
		if ( values === false ) {
			return state;
		}

		return {
			...state,
			detectedEventsChange: {
				...state.detectedEventsChange,
				newEvents: [],
			},
		};
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
	reducerCallback: ( state, values ) => {
		if ( values === false ) {
			return state;
		}

		return {
			...state,
			detectedEventsChange: {
				...state.detectedEventsChange,
				lostEvents: [],
			},
		};
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
	 * @since 1.140.0
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
	 * @since 1.140.0
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
	 * @since 1.140.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} TRUE if `newEvents` are present, FALSE otherwise.
	 */
	hasNewConversionReportingEvents:
		hasConversionReportingEventsOfType( 'newEvents' ),

	/**
	 * Checks if lostEvents are present.
	 *
	 * @since 1.140.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} TRUE if `lostEvents` are present, FALSE otherwise.
	 */
	hasLostConversionReportingEvents:
		hasConversionReportingEventsOfType( 'lostEvents' ),

	/**
	 * Checks if there are key metrics widgets connected with the detected events for the supplied purpose answer.
	 *
	 * @since 1.141.0
	 *
	 * @param {string}  purpose      Value of saved site purpose from user input settings.
	 * @param {boolean} useNewEvents Flag inclusion of detected new events, otherwise initial detected events will be used.
	 * @return {boolean|undefined} TRUE if current site purpose will have any ACR key metrics widgets assigned to it, FALSE otherwise, and undefined if metrics are not loaded.
	 */
	haveConversionEventsForTailoredMetrics: createRegistrySelector(
		( select ) => ( state, useNewEvents ) => {
			const conversionReportingEventsChange = useNewEvents
				? select(
						MODULES_ANALYTICS_4
				  ).getConversionReportingEventsChange()?.newEvents
				: select( MODULES_ANALYTICS_4 ).getDetectedEvents();

			const currentTailoredMetrics =
				select( CORE_USER ).getAnswerBasedMetrics();

			const tailoredMetricsWithNewEvents = select(
				CORE_USER
			).getAnswerBasedMetrics( null, conversionReportingEventsChange );

			return tailoredMetricsWithNewEvents?.some(
				( metric, index ) =>
					metric !== currentTailoredMetrics?.[ index ]
			);
		}
	),

	/**
	 * Checks if there are key metrics widgets that rely on the conversion events that have been lost.
	 *
	 * @since 1.142.0
	 *
	 * @return {boolean|undefined} TRUE if current metrics are depending on the conversion events that have been lost, FALSE otherwise, and undefined if event change data is not resolved.
	 */
	haveLostEventsForCurrentMetrics: createRegistrySelector(
		( select ) => () => {
			const conversionEventWidgets =
				select(
					MODULES_ANALYTICS_4
				).getKeyMetricsConversionEventWidgets();

			const currentMetrics = select( CORE_USER ).getKeyMetrics();

			const conversionReportingLostEvents =
				select(
					MODULES_ANALYTICS_4
				).getConversionReportingEventsChange()?.lostEvents;

			return conversionReportingLostEvents?.some( ( event ) =>
				conversionEventWidgets[ event ]?.some( ( widget ) =>
					currentMetrics?.includes( widget )
				)
			);
		}
	),

	/**
	 * Returns the conversion events associated with the current site purpose.
	 *
	 * @since 1.142.0
	 *
	 * @return {Array|undefined} List of detected conversion events connected to the current site purpose, or undefined if data is not resolved.
	 */
	getUserInputPurposeConversionEvents: createRegistrySelector(
		( select ) => () => {
			const userInputSettings =
				select( CORE_USER ).getUserInputSettings();

			const purpose = userInputSettings?.purpose?.values?.[ 0 ];

			const purposeEvents =
				USER_INPUT_PURPOSE_TO_CONVERSION_EVENTS_MAPPING[ purpose ];

			const detectedEvents =
				select( MODULES_ANALYTICS_4 ).getDetectedEvents();

			return purposeEvents?.reduce( ( acc, event ) => {
				if ( detectedEvents?.includes( event ) ) {
					return [ ...acc, event ];
				}
				return acc;
			}, [] );
		}
	),

	/**
	 * Gets conversion events related metrics.
	 *
	 * @since 1.142.0
	 * @private
	 *
	 * @return {Object} Metrics list object.
	 */
	getKeyMetricsConversionEventWidgets() {
		const leadRelatedMetrics = [
			KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
			KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
			KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
		];

		return {
			purchase: [
				KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
				KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
			],
			add_to_cart: [
				KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
			],
			contact: leadRelatedMetrics,
			submit_lead_form: leadRelatedMetrics,
			generate_lead: leadRelatedMetrics,
		};
	},

	/**
	 * Checks if there are conversion events for the user picked metrics.
	 *
	 * @since 1.142.0
	 *
	 * @param {boolean} useNewEvents Flag inclusion of detected new events, otherwise initial detected events will be used.
	 * @return {boolean|undefined} `true` if there are any ACR key metrics based on the users existing selected metrics, `false` otherwise. Will return `undefined` if the data is not loaded yet.
	 */
	haveConversionEventsForUserPickedMetrics: createRegistrySelector(
		( select ) => ( state, useNewEvents ) => {
			const conversionEventWidgets =
				select(
					MODULES_ANALYTICS_4
				).getKeyMetricsConversionEventWidgets();

			const userPickedKeyMetrics =
				select( CORE_USER ).getUserPickedMetrics();

			const conversionReportingEventsChange = useNewEvents
				? select(
						MODULES_ANALYTICS_4
				  ).getConversionReportingEventsChange()?.newEvents
				: select( MODULES_ANALYTICS_4 ).getDetectedEvents();

			return conversionReportingEventsChange?.some( ( event ) =>
				conversionEventWidgets[ event ]?.some( ( widget ) => {
					return ! userPickedKeyMetrics?.includes( widget );
				} )
			);
		}
	),

	/**
	 * Checks if there are new conversion events after initial events were detected. Regardless of how KM were setup.
	 *
	 * @since 1.142.0
	 *
	 * @return {boolean} `true` if there are metrics related to the new conversion events that differ from already detected/selected ones, `false` otherwise.
	 */
	haveConversionEventsWithDifferentMetrics: createRegistrySelector(
		( select ) => () => {
			const leadEvents = [
				'contact',
				'generate_lead',
				'submit_lead_form',
			];
			const isGA4Connected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

			if ( ! isGA4Connected ) {
				return false;
			}

			const {
				getDetectedEvents,
				getConversionReportingEventsChange,
				haveConversionEventsForUserPickedMetrics,
				haveConversionEventsForTailoredMetrics,
				getKeyMetricsConversionEventWidgets,
			} = select( MODULES_ANALYTICS_4 );

			const detectedEvents = getDetectedEvents();
			const conversionReportingEventsChange =
				getConversionReportingEventsChange();

			if (
				! detectedEvents?.length ||
				! conversionReportingEventsChange?.newEvents?.length ||
				// If events in detectedEvents do not differ from the new ones it means
				// it is the initial detection, since after initial detection newEvents will
				// only contain the difference in events.
				isEqual(
					safelySort( conversionReportingEventsChange?.newEvents ),
					safelySort( detectedEvents )
				)
			) {
				return false;
			}

			const detectedLeadEvents = detectedEvents.filter( ( event ) =>
				leadEvents.includes( event )
			);
			const newLeadEvents =
				conversionReportingEventsChange.newEvents.filter( ( event ) =>
					leadEvents.includes( event )
				);
			const newNonLeadEvents =
				conversionReportingEventsChange.newEvents.filter(
					( event ) => ! leadEvents.includes( event )
				);

			// If new events include only additional lead events return early.
			if (
				detectedLeadEvents.length > 1 &&
				newLeadEvents.length > 0 &&
				! newNonLeadEvents.length
			) {
				return false;
			}

			const { getUserPickedMetrics, getKeyMetrics } = select( CORE_USER );

			const userPickedMetrics = getUserPickedMetrics();
			const haveNewConversionEventsForUserPickedMetrics =
				haveConversionEventsForUserPickedMetrics( true );

			if (
				userPickedMetrics?.length &&
				! haveNewConversionEventsForUserPickedMetrics
			) {
				return false;
			}

			const keyMetricsConversionEventWidgets =
				getKeyMetricsConversionEventWidgets();
			const newConversionEventKeyMetrics = [];

			// Pick all conversion event widgets associated with new events.
			for ( const event in keyMetricsConversionEventWidgets ) {
				if (
					conversionReportingEventsChange.newEvents.includes( event )
				) {
					newConversionEventKeyMetrics.push(
						...keyMetricsConversionEventWidgets[ event ]
					);
				}
			}
			const currentKeyMetrics = getKeyMetrics();
			const haveAllConversionEventMetrics =
				newConversionEventKeyMetrics.every( ( keyMetric ) =>
					currentKeyMetrics?.includes( keyMetric )
				);

			// If the current site purpose has all conversion event metrics,
			// or there are some metrics that can be added via "Add
			// metrics CTA", don't show the "View metrics" variation.
			if (
				! userPickedMetrics?.length &&
				( haveConversionEventsForTailoredMetrics( true ) ||
					haveAllConversionEventMetrics )
			) {
				return false;
			}

			return true;
		}
	),
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
