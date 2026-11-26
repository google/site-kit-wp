/**
 * `modules/analytics-4` data store: conversion insights.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	Registry,
	Select,
	combineStores,
	commonActions,
	createReducer,
	createRegistryControl,
	createRegistrySelector,
} from 'googlesitekit-data';
// In the built plugin, `googlesitekit-api` is the `googlesitekit.api` global,
// which has no `createCacheKey()`.
import { createCacheKey } from '@/js/googlesitekit/api';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { isValidDateString } from '@/js/util';
import { getLocale } from '@/js/util/i18n';
import { MODULES_ANALYTICS_4 } from './constants';
import { ConversionInsight } from './types';
import {
	AIInsightOperationResponse,
	AIInsightOutcome,
	AIInsightSubmitResponse,
	resolveAIInsight,
} from './utils/ai-insight';

const { clearSelectorError, setErrorForSelector } = errorStoreActions;

const RESOLVE_CONVERSION_INSIGHT = 'RESOLVE_CONVERSION_INSIGHT';
const RECEIVE_CONVERSION_INSIGHT = 'RECEIVE_CONVERSION_INSIGHT';

interface ConversionInsightParams {
	/** The goal type of the widget: `lead` or `ecommerce`. */
	goalType: GoalType;
	/** The tab of the widget, or an empty string for the whole widget. */
	tabID: string;
	/** The last day of the period, as `YYYY-MM-DD`. */
	endDate: string;
}

interface ConversionInsightsState {
	/** The insight for each goal type, tab and end date, or null when there is none to show. */
	conversionInsights: Record< string, ConversionInsight | null >;
}

/**
 * Throws an error when the goal type, the tab or the end date of an insight
 * is not one the datapoint accepts.
 *
 * @since 1.193.0
 *
 * @param {Object} params          The insight's parameters.
 * @param {string} params.goalType The goal type: `lead` or `ecommerce`.
 * @param {string} params.tabID    The tab, or an empty string for the whole widget.
 * @param {string} params.endDate  The last day of the period, as `YYYY-MM-DD`.
 * @return {void}
 */
function validateConversionInsightParams( {
	goalType,
	tabID,
	endDate,
}: Partial< ConversionInsightParams > = {} ) {
	invariant(
		Object.values( GOAL_TYPES ).includes( goalType as GoalType ),
		'goalType must be lead or ecommerce.'
	);
	invariant( typeof tabID === 'string', 'tabID must be a string.' );
	invariant( isValidDateString( endDate ), 'endDate must be a valid date.' );
}

/**
 * Gets the key of the insight of a goal type, tab and end date in the store's
 * state.
 *
 * @since 1.193.0
 *
 * @param {Object} params          The insight's parameters.
 * @param {string} params.goalType The goal type: `lead` or `ecommerce`.
 * @param {string} params.tabID    The tab, or an empty string for the whole widget.
 * @param {string} params.endDate  The last day of the period, as `YYYY-MM-DD`.
 * @return {string} The key.
 */
function getStateKey( { goalType, tabID, endDate }: ConversionInsightParams ) {
	// A tab is a form ID or an event provider, which can contain any
	// character, so the parts are kept apart as a list.
	return JSON.stringify( [ goalType, tabID, endDate ] );
}

/**
 * Gets the key of the entry the store keeps for an insight in the storage of
 * the API cache.
 *
 * `API.set()` clears every key that starts with the name of the datapoint it
 * wrote to, so the entry has a group of its own rather than one that starts
 * with `conversion-insights`. The key has the user's locale, so a change of
 * language asks for an insight in the new language.
 *
 * @since 1.193.0
 *
 * @param {Object} params          The insight's parameters.
 * @param {string} params.goalType The goal type: `lead` or `ecommerce`.
 * @param {string} params.tabID    The tab, or an empty string for the whole widget.
 * @param {string} params.endDate  The last day of the period, as `YYYY-MM-DD`.
 * @return {string} The key.
 */
function getInsightCacheKey( {
	goalType,
	tabID,
	endDate,
}: ConversionInsightParams ): string {
	return createCacheKey(
		'modules',
		MODULE_SLUG_ANALYTICS_4,
		'conversion-generated-insight',
		{ goalType, tabID, endDate, locale: getLocale() }
	);
}

const fetchSubmitConversionInsightStore = createFetchStore( {
	baseName: 'submitConversionInsight',
	controlCallback: ( {
		goalType,
		tabID,
		endDate,
	}: ConversionInsightParams ): Promise<
		AIInsightSubmitResponse< ConversionInsight >
	> =>
		set( 'modules', MODULE_SLUG_ANALYTICS_4, 'conversion-insights', {
			goalType,
			tab: tabID,
			endDate,
		} ),
	argsToParams: ( goalType: GoalType, tabID: string, endDate: string ) => ( {
		goalType,
		tabID,
		endDate,
	} ),
	validateParams: validateConversionInsightParams,
} );

const fetchGetConversionInsightOperationStore = createFetchStore( {
	baseName: 'getConversionInsightOperation',
	controlCallback: ( {
		operationID,
	}: {
		operationID: string;
	} ): Promise< AIInsightOperationResponse< ConversionInsight > > =>
		// The operation changes while its ID stays the same, so its state
		// must never come from the API cache.
		get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'conversion-insights',
			{ operationID },
			{ useCache: false }
		),
	argsToParams: ( operationID: string ) => ( { operationID } ),
	validateParams: ( { operationID }: { operationID?: string } = {} ) => {
		invariant(
			typeof operationID === 'string' && operationID.length > 0,
			'operationID is required.'
		);
	},
} );

const baseInitialState: ConversionInsightsState = {
	conversionInsights: {},
};

const baseActions = {
	/**
	 * Stores the generated Site Goals insight of a goal type, tab and end
	 * date.
	 *
	 * @since 1.193.0
	 *
	 * @param {(Object|null)} insight         The insight, or null when there is none to show.
	 * @param {Object}        params          The insight's parameters.
	 * @param {string}        params.goalType The goal type: `lead` or `ecommerce`.
	 * @param {string}        params.tabID    The tab, or an empty string for the whole widget.
	 * @param {string}        params.endDate  The last day of the period, as `YYYY-MM-DD`.
	 * @return {Object} Redux-style action.
	 */
	receiveConversionInsight(
		insight: ConversionInsight | null,
		params: ConversionInsightParams
	) {
		invariant(
			insight === null || isPlainObject( insight ),
			'insight must be an object or null.'
		);
		validateConversionInsightParams( params );

		return {
			type: RECEIVE_CONVERSION_INSIGHT,
			payload: { insight, params },
		};
	},
};

const baseControls = {
	// The control runs the requests for the insight and the waits between
	// them, which the resolver can't run itself.
	[ RESOLVE_CONVERSION_INSIGHT ]: createRegistryControl(
		( registry: Registry ) =>
			( { payload }: { payload: ConversionInsightParams } ) => {
				const { goalType, tabID, endDate } = payload;
				const {
					fetchSubmitConversionInsight,
					fetchGetConversionInsightOperation,
					clearSelectorError: clearError,
				} = registry.dispatch( MODULES_ANALYTICS_4 );

				return resolveAIInsight< ConversionInsight >( {
					// The store reports the outcome as the error of
					// `getConversionInsight()`, not as the error of each
					// request.
					submit: async () => {
						const result = await fetchSubmitConversionInsight(
							goalType,
							tabID,
							endDate
						);
						await clearError( 'submitConversionInsight', [
							goalType,
							tabID,
							endDate,
						] );

						return result;
					},
					readOperation: async ( operationID: string ) => {
						const result = await fetchGetConversionInsightOperation(
							operationID
						);
						await clearError( 'getConversionInsightOperation', [
							operationID,
						] );

						return result;
					},
					cacheKey: getInsightCacheKey( payload ),
					invalidResponseErrorCode:
						'invalid_conversion_insight_response',
					timeoutErrorCode: 'conversion_insight_timeout',
					failedErrorCode: 'conversion_insight_failed',
				} );
			}
	),
};

const baseReducer = createReducer(
	(
		state: ConversionInsightsState,
		{
			type,
			payload,
		}: {
			type: string;
			payload: {
				insight: ConversionInsight | null;
				params: ConversionInsightParams;
			};
		}
	) => {
		switch ( type ) {
			case RECEIVE_CONVERSION_INSIGHT: {
				state.conversionInsights[ getStateKey( payload.params ) ] =
					payload.insight;
				break;
			}

			default:
				break;
		}
	}
);

const baseResolvers = {
	*getConversionInsight(
		goalType: GoalType,
		tabID: string,
		endDate: string
	): Generator< unknown, void, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		try {
			validateConversionInsightParams( { goalType, tabID, endDate } );
		} catch {
			// A component may select the insight before it knows its tab or
			// end date. Nothing is read or sent, and the insight stays
			// `undefined` until it selects it with ones the datapoint accepts.
			return;
		}

		if (
			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( goalType, tabID, endDate ) !== undefined
		) {
			return;
		}

		yield clearSelectorError( 'getConversionInsight', [
			goalType,
			tabID,
			endDate,
		] );

		const params = { goalType, tabID, endDate };

		const outcome = ( yield {
			type: RESOLVE_CONVERSION_INSIGHT,
			payload: params,
		} ) as AIInsightOutcome< ConversionInsight >;

		if ( 'insight' in outcome ) {
			yield baseActions.receiveConversionInsight(
				outcome.insight,
				params
			);
			return;
		}

		// The error is stored first, so whoever reads the null insight can
		// already read the error that caused it.
		yield setErrorForSelector( outcome.error, 'getConversionInsight', [
			goalType,
			tabID,
			endDate,
		] );

		yield baseActions.receiveConversionInsight( null, params );
	},
};

const baseSelectors = {
	/**
	 * Gets the generated Site Goals insight of a widget, or of one of its
	 * tabs.
	 *
	 * The first call for a goal type, tab and end date reads the insight
	 * from the browser cache, or asks the Site Kit service for it and waits
	 * until it arrives. Read the error that stopped it with
	 * `getErrorForSelector( 'getConversionInsight', [ goalType, tabID, endDate ] )`.
	 *
	 * @since 1.193.0
	 *
	 * @param {Object} state    The data store's state.
	 * @param {string} goalType The goal type of the widget: `lead` or `ecommerce`.
	 * @param {string} tabID    The tab of the widget, or an empty string for the whole widget.
	 * @param {string} endDate  The last day of the period, as `YYYY-MM-DD`.
	 * @return {(Object|null|undefined)} The insight, with `interactionID`, `scenario`, `code`, `text` and `actionableRecommendation`; null when there is none to show, because the service had nothing to say, the request failed or took too long; or `undefined` while it loads.
	 */
	getConversionInsight(
		state: ConversionInsightsState,
		goalType: GoalType,
		tabID: string,
		endDate: string
	): ConversionInsight | null | undefined {
		return state.conversionInsights[
			getStateKey( { goalType, tabID, endDate } )
		];
	},

	/**
	 * Checks whether the generated Site Goals insight of a widget, or of one
	 * of its tabs, is still loading.
	 *
	 * The insight loads while `getConversionInsight()` resolves it: from the
	 * first request until it arrives or the store gives up, through every
	 * wait between two reads of the operation that generates it. Checking
	 * it sends no request.
	 *
	 * @since 1.193.0
	 *
	 * @param {Object} state    The data store's state.
	 * @param {string} goalType The goal type of the widget: `lead` or `ecommerce`.
	 * @param {string} tabID    The tab of the widget, or an empty string for the whole widget.
	 * @param {string} endDate  The last day of the period, as `YYYY-MM-DD`.
	 * @return {boolean} True while the insight loads, false before its first request and once it or a failure is stored.
	 */
	isLoadingConversionInsight: createRegistrySelector(
		( select: Select ) =>
			(
				state: ConversionInsightsState,
				goalType: GoalType,
				tabID: string,
				endDate: string
			): boolean =>
				select( MODULES_ANALYTICS_4 ).isResolving(
					'getConversionInsight',
					[ goalType, tabID, endDate ]
				)
	),
};

const store = combineStores(
	fetchSubmitConversionInsightStore,
	fetchGetConversionInsightOperationStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export default store;
