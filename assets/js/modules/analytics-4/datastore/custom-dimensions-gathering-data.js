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
import { getDateString } from '../../../util';
import { CUSTOM_DIMENSION_DEFINITIONS, MODULES_ANALYTICS_4 } from './constants';

const { createRegistryControl, createRegistrySelector } = Data;

const RECEIVE_CUSTOM_DIMENSION_GATHERING_DATA =
	'RECEIVE_CUSTOM_DIMENSION_GATHERING_DATA';
const WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE =
	'WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE';

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
	 * @since n.e.x.t
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
};

const baseControls = {
	[ WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE ]:
		createRegistryControl(
			( registry ) =>
				( { payload: { customDimension } } ) => {
					const dataAvailabityDetermined = () =>
						registry
							.select( MODULES_ANALYTICS_4 )
							.selectCustomDimensionDataAvailability(
								customDimension
							) !== undefined;

					if ( dataAvailabityDetermined() ) {
						return true;
					}

					return new Promise( ( resolve ) => {
						const unsubscribe = registry.subscribe( () => {
							if ( dataAvailabityDetermined() ) {
								unsubscribe();
								resolve( true );
							}
						} );
					} );
				}
		),
};

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

		yield {
			payload: {
				customDimension,
			},
			type: WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE,
		};

		const dataAvailability = registry
			.select( MODULES_ANALYTICS_4 )
			.selectCustomDimensionDataAvailability( customDimension );

		yield baseActions.receiveIsCustomDimensionGatheringData(
			customDimension,
			! dataAvailability
		);

		if ( dataAvailability ) {
			yield fetchSaveCustomDimensionDataAvailableStateStore.actions.fetchSaveCustomDimensionDataAvailableState(
				customDimension
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Determines whether data is available for the custom dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} customDimension Custom dimension slug.
	 * @return {boolean|undefined|null} Returns TRUE if data is available, otherwise FALSE.
	 *                                  If the request is still being resolved, returns undefined.
	 *                                  If the data availability can not be determined, returns null.
	 */
	selectCustomDimensionDataAvailability: createRegistrySelector(
		( select ) => ( state, customDimension ) => {
			if (
				! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
					customDimension
				)
			) {
				return false;
			}

			const isAuthenticated = select( CORE_USER ).isAuthenticated();

			if ( isAuthenticated === undefined ) {
				return undefined;
			}
			if ( ! isAuthenticated ) {
				return false;
			}

			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			if ( propertyID === undefined ) {
				return undefined;
			}

			const property =
				select( MODULES_ANALYTICS_4 ).getProperty( propertyID );

			if ( property === undefined ) {
				return undefined;
			}

			const startDate = getDateString( new Date( property.createTime ) );

			const endDate = select( CORE_USER ).getReferenceDate();

			const reportArgs = {
				startDate,
				endDate,
				dimensions: [ `customEvent:${ customDimension }` ],
				limit: 2,
			};

			// We may legitimately want to return early before using `report` if the report is not resolved or results in an error.
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const report =
				select( MODULES_ANALYTICS_4 ).getReport( reportArgs );

			const hasResolvedReport = select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getReport', [ reportArgs ] );

			if ( ! hasResolvedReport ) {
				return undefined;
			}

			const hasReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ reportArgs ] );

			// If there is an error, return `null` since we don't know if there is data or not.
			if ( hasReportError ) {
				return null;
			}

			if ( ! report?.rows?.length ) {
				return false;
			}

			// If the only dimension value is '(not set)', then there is no data. See https://support.google.com/analytics/answer/13504892.
			const isZeroReport =
				report.rowCount === 1 &&
				report.rows[ 0 ].dimensionValues?.[ 0 ]?.value === '(not set)';

			return ! isZeroReport;
		}
	),

	/**
	 * Determines whether the custom dimension is still gathering data or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} customDimension Custom dimension slug.
	 * @return {boolean|undefined} Returns TRUE if gathering data, otherwise FALSE. If the request is still being resolved, returns undefined.
	 */
	isCustomDimensionGatheringData( state, customDimension ) {
		return state.customDimensionsGatheringData[ customDimension ];
	},
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
