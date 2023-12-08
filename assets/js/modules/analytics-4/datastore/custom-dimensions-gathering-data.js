/**
 * `modules/analytics-4` data store: custom dimensions gathering data store.
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

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
import { CUSTOM_DIMENSION_DEFINITIONS, MODULES_ANALYTICS_4 } from './constants';
import { getDateString } from '../../../util';

const { createRegistrySelector } = Data;

const RECEIVE_CUSTOM_DIMENSION_GATHERING_DATA =
	'RECEIVE_CUSTOM_DIMENSION_GATHERING_DATA';

const fetchSaveCustomDimensionDataAvailableStateStore = createFetchStore( {
	baseName: 'saveCustomDimensionDataAvailableState',
	controlCallback: ( { customDimension } ) =>
		API.set( 'modules', 'analytics-4', 'custom-dimension-data-available', {
			customDimension,
		} ),
	argsToParams: ( customDimension ) => ( { customDimension } ),
	validateParams: ( { customDimension } ) => {
		invariant(
			'string' === typeof customDimension && customDimension.length > 0,
			'customDimension must be a non-empty string.'
		);
	},
} );

/*
 * The initial state shape is as follows:
 *
 * {
 *   customDimensionsGatheringData: {
 *     googlesitekit_post_date: undefined,
 *     googlesitekit_post_author: undefined,
 *     // etc.
 *   },
 * }
 */
const baseInitialState = {
	customDimensionsGatheringData: Object.keys(
		CUSTOM_DIMENSION_DEFINITIONS
	).reduce(
		( initialStateSlice, customDimension ) => ( {
			...initialStateSlice,
			[ customDimension ]: undefined,
		} ),
		{}
	),
};

const baseActions = {
	/**
	 * Receives gathering data state for a custom dimension.
	 *
	 * @since 1.113.0
	 * @private
	 *
	 * @param {string}  customDimension Custom dimension slug.
	 * @param {boolean} gatheringData   Gathering data.
	 * @return {Object} Redux-style action.
	 */
	receiveIsCustomDimensionGatheringData( customDimension, gatheringData ) {
		invariant(
			'string' === typeof customDimension && customDimension.length > 0,
			'customDimension must be a non-empty string.'
		);
		invariant(
			'boolean' === typeof gatheringData,
			'gatheringData must be a boolean.'
		);

		return {
			payload: {
				customDimension,
				gatheringData,
			},
			type: RECEIVE_CUSTOM_DIMENSION_GATHERING_DATA,
		};
	},

	/**
	 * Checks whether data is available for the custom dimension.
	 *
	 * If data is available, saves the data available state to the server.
	 *
	 * @since 1.113.0
	 *
	 * @param {string} customDimension Custom dimension slug.
	 */
	*checkCustomDimensionDataAvailability( customDimension ) {
		const { select, resolveSelect } =
			yield Data.commonActions.getRegistry();

		yield Data.commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		if (
			! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				customDimension
			)
		) {
			yield baseActions.receiveIsCustomDimensionGatheringData(
				customDimension,
				true
			);
			return;
		}

		yield Data.commonActions.await(
			resolveSelect( CORE_USER ).getAuthentication()
		);

		if ( ! select( CORE_USER ).isAuthenticated() ) {
			yield baseActions.receiveIsCustomDimensionGatheringData(
				customDimension,
				true
			);
			return;
		}

		const reportArgs = yield Data.commonActions.await(
			resolveSelect(
				MODULES_ANALYTICS_4
			).getDataAvailabilityReportOptions( customDimension )
		);

		if ( ! reportArgs ) {
			yield baseActions.receiveIsCustomDimensionGatheringData(
				customDimension,
				true
			);
			return;
		}

		const report = yield Data.commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getReport( reportArgs )
		);

		const hasReportError = !! select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ reportArgs ] );

		const isGatheringData =
			hasReportError ||
			! report?.rows?.length ||
			// If the only dimension value is '(not set)', then there is no data. See https://support.google.com/analytics/answer/13504892.
			( report.rowCount === 1 &&
				report.rows[ 0 ].dimensionValues?.[ 0 ]?.value ===
					'(not set)' );

		yield baseActions.receiveIsCustomDimensionGatheringData(
			customDimension,
			isGatheringData
		);

		if ( ! isGatheringData ) {
			yield fetchSaveCustomDimensionDataAvailableStateStore.actions.fetchSaveCustomDimensionDataAvailableState(
				customDimension
			);
		}
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_CUSTOM_DIMENSION_GATHERING_DATA: {
			const { customDimension, gatheringData } = payload;

			state.customDimensionsGatheringData[ customDimension ] =
				gatheringData;

			break;
		}

		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*isCustomDimensionGatheringData( customDimension ) {
		const registry = yield Data.commonActions.getRegistry();

		// If the gatheringData flag is already set, return early.
		if (
			registry
				.select( MODULES_ANALYTICS_4 )
				.isCustomDimensionGatheringData( customDimension ) !== undefined
		) {
			return;
		}

		const dataAvailableOnLoad =
			global._googlesitekitModulesData?.[ 'analytics-4' ]
				?.customDimensionsDataAvailable?.[ customDimension ];

		// If dataAvailableOnLoad is true, set gatheringData to false and do nothing else.
		if ( dataAvailableOnLoad ) {
			yield baseActions.receiveIsCustomDimensionGatheringData(
				customDimension,
				false
			);
			return;
		}

		yield baseActions.checkCustomDimensionDataAvailability(
			customDimension
		);
	},

	*getDataAvailabilityReportOptions() {
		const { resolveSelect } = yield Data.commonActions.getRegistry();

		yield Data.commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getPropertyCreateTime()
		);
	},
};

const baseSelectors = {
	/**
	 * Determines whether the custom dimension is still gathering data or not.
	 *
	 * @since 1.113.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} customDimension Custom dimension slug.
	 * @return {boolean|undefined} Returns TRUE if gathering data, otherwise FALSE. If the request is still being resolved, returns undefined.
	 */
	isCustomDimensionGatheringData( state, customDimension ) {
		return state.customDimensionsGatheringData[ customDimension ];
	},

	/**
	 * Determines whether any of the provided custom dimensions are still gathering data.
	 *
	 * @since 1.113.0
	 *
	 * @param {Object}        state            Data store's state.
	 * @param {Array<string>} customDimensions Array of custom dimension slugs.
	 * @return {boolean|undefined} Returns TRUE if any of the provided custom dimensions are gathering data, otherwise FALSE.
	 * 														 If any of the corresponding state is still being resolved, returns undefined.
	 */
	areCustomDimensionsGatheringData: createRegistrySelector(
		( select ) => ( state, customDimensions ) => {
			const { isCustomDimensionGatheringData } =
				select( MODULES_ANALYTICS_4 );

			// Return undefined if any of the custom dimensions' gathering data state is undefined,
			// or true if any of the custom dimensions' gathering data state is true.
			for ( const gatheringDataState of [ undefined, true ] ) {
				if (
					customDimensions.some(
						( dimension ) =>
							isCustomDimensionGatheringData( dimension ) ===
							gatheringDataState
					)
				) {
					return gatheringDataState;
				}
			}

			// Otherwise, all custom dimensions' gathering data state is false.
			return false;
		}
	),

	/**
	 * Gets the options for the data availability report.
	 *
	 * @since 1.114.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} customDimension Custom dimension slug.
	 * @return {Object|undefined} Returns the report options if the property is loaded, otherwise undefined.
	 */
	getDataAvailabilityReportOptions: createRegistrySelector(
		( select ) => ( state, customDimension ) => {
			invariant( customDimension, 'customDimension is required.' );

			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			if ( ! propertyID ) {
				return undefined;
			}

			const propertyCreateTime =
				select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();

			if ( ! propertyCreateTime ) {
				return undefined;
			}

			const endDate = select( CORE_USER ).getReferenceDate();

			return {
				startDate: getDateString( new Date( propertyCreateTime ) ),
				endDate,
				dimensions: [ `customEvent:${ customDimension }` ],
				metrics: [ { name: 'eventCount' } ],
				limit: 2,
			};
		}
	),

	/**
	 * Gets the errors for the data availability report.
	 *
	 * @since 1.114.0
	 *
	 * @param {Object} state            Data store's state.
	 * @param {Array}  customDimensions Array of custom dimension slugs.
	 * @return {Object} Returns an object of errors keyed by custom dimension slug.
	 */
	getDataAvailabilityReportErrors: createRegistrySelector(
		( select ) => ( state, customDimensions ) => {
			invariant( customDimensions, 'customDimensions is required.' );
			invariant(
				Array.isArray( customDimensions ),
				'customDimensions must be an array.'
			);

			const { getDataAvailabilityReportOptions, getErrorForSelector } =
				select( MODULES_ANALYTICS_4 );

			return customDimensions.reduce( ( errors, customDimension ) => {
				const reportArgs =
					getDataAvailabilityReportOptions( customDimension );

				if ( ! reportArgs ) {
					return errors;
				}

				const error = getErrorForSelector( 'getReport', [
					reportArgs,
				] );

				if ( error ) {
					return {
						...errors,
						[ customDimension ]: error,
					};
				}

				return errors;
			}, {} );
		}
	),
};

const store = Data.combineStores(
	fetchSaveCustomDimensionDataAvailableStateStore,
	{
		actions: baseActions,
		controls: baseControls,
		initialState: baseInitialState,
		reducer: baseReducer,
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
