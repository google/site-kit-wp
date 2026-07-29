/**
 * `modules/analytics-4` data store: conversion insights (Site Goals AI insights).
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { set } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from './constants';

/**
 * Builds a stable cache key for an events payload.
 *
 * The events array is assembled deterministically by the plugin (fixed field
 * order), so a JSON serialization is a stable key for both resolution tracking
 * and state storage.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} events EventData objects sent to the endpoint.
 * @return {string} Cache key.
 */
function getConversionInsightsCacheKey( events ) {
	return JSON.stringify( events );
}

const fetchGetConversionInsightsStore = createFetchStore( {
	baseName: 'getConversionInsights',
	controlCallback: ( { events } ) =>
		set( 'modules', MODULE_SLUG_ANALYTICS_4, 'conversion-insights', {
			events,
		} ),
	reducerCallback: createReducer( ( state, response, { events } ) => {
		// The service returns `{ insights: EventInsight[] }`; store the list keyed
		// by the events payload so each widget can look up its own event.
		state.conversionInsights[ getConversionInsightsCacheKey( events ) ] =
			Array.isArray( response?.insights ) ? response.insights : [];
	} ),
	argsToParams: ( events ) => ( { events } ),
	validateParams: ( { events } = {} ) => {
		invariant(
			Array.isArray( events ) && events.length > 0,
			'events must be a non-empty array.'
		);
	},
} );

const baseInitialState = {
	conversionInsights: {},
};

const baseResolvers = {
	*getConversionInsights( events ) {
		if ( ! Array.isArray( events ) || events.length === 0 ) {
			return;
		}

		const registry = yield commonActions.getRegistry();

		const existing = registry
			.select( MODULES_ANALYTICS_4 )
			.getConversionInsights( events );

		if ( existing === undefined ) {
			yield fetchGetConversionInsightsStore.actions.fetchGetConversionInsights(
				events
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the generated conversion insights for the given events payload.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}   state  Data store's state.
	 * @param {Object[]} events EventData objects sent to the endpoint.
	 * @return {(Object[]|undefined)} List of EventInsight objects, or `undefined` if not loaded.
	 */
	getConversionInsights( state, events ) {
		return state.conversionInsights[
			getConversionInsightsCacheKey( events )
		];
	},

	/**
	 * Gets the insight for a single key event within the given events payload.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}   state        Data store's state.
	 * @param {Object[]} events       EventData objects sent to the endpoint.
	 * @param {string}   keyEventName The key event name to look up.
	 * @return {(Object|null|undefined)} The matching EventInsight, `null` when resolved but no
	 *                                   insight matched, or `undefined` while loading.
	 */
	getConversionInsight: createRegistrySelector(
		( select ) => ( state, events, keyEventName ) => {
			const insights =
				select( MODULES_ANALYTICS_4 ).getConversionInsights( events );

			if ( insights === undefined ) {
				return undefined;
			}

			return (
				insights.find(
					( insight ) => insight.key_event_name === keyEventName
				) || null
			);
		}
	),

	/**
	 * Checks whether the conversion insights request for the given events is loading.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}   state  Data store's state.
	 * @param {Object[]} events EventData objects sent to the endpoint.
	 * @return {boolean} `true` if the request has not finished resolving, otherwise `false`.
	 */
	isLoadingConversionInsights: createRegistrySelector(
		( select ) => ( state, events ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getConversionInsights',
				[ events ]
			)
	),

	/**
	 * Gets the error (if any) from the conversion insights request for the given events.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}   state  Data store's state.
	 * @param {Object[]} events EventData objects sent to the endpoint.
	 * @return {(Object|undefined)} The error object, or `undefined` if there was no error.
	 */
	getConversionInsightsError: createRegistrySelector(
		( select ) => ( state, events ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getConversionInsights',
				[ events ]
			)
	),
};

const store = combineStores( fetchGetConversionInsightsStore, {
	initialState: baseInitialState,
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
