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
const RECEIVE_CUSTOM_DIMENSION_DATA_AVAILABLE_ON_LOAD =
	'RECEIVE_CUSTOM_DIMENSION_DATA_AVAILABLE_ON_LOAD';
const WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE =
	'WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE';

const fetchSaveCustomDimensionDataAvailableStateStore = createFetchStore( {
	baseName: 'saveCustomDimensionDataAvailableState',
	controlCallback: ( { parameterName } ) =>
		API.set( 'modules', 'analytics-4', 'custom-dimension-data-available', {
			parameterName,
		} ),
	argsToParams: ( parameterName ) => ( { parameterName } ),
	validateParams: ( { parameterName } ) => {
		invariant(
			'string' === typeof parameterName,
			'parameterName must be a string.'
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
 *   customDimensionsDataAvailableOnLoad: {
 *     googlesitekit_post_date: false,
 *     googlesitekit_post_author: true,
 *     // etc.
 *   }
 * }
 */
const baseInitialState = {
	customDimensionsGatheringData: Object.keys(
		CUSTOM_DIMENSION_DEFINITIONS
	).reduce( ( initialStateSlice, parameterName ) => {
		initialStateSlice[ parameterName ] = undefined;
		return initialStateSlice;
	}, {} ),

	customDimensionsDataAvailableOnLoad:
		global._googlesitekitModulesData?.[ 'analytics-4' ]
			?.customDimensionsDataAvailable,
};

const baseActions = {
	/**
	 * Receives gathering data state for a custom dimension.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string}  parameterName Custom dimension parameter name.
	 * @param {boolean} gatheringData Gathering data.
	 * @return {Object} Redux-style action.
	 */
	receiveIsCustomDimensionGatheringData( parameterName, gatheringData ) {
		invariant(
			'string' === typeof parameterName,
			'parameterName must be a string.'
		);
		invariant(
			'boolean' === typeof gatheringData,
			'gatheringData must be a boolean.'
		);

		return {
			payload: {
				parameterName,
				gatheringData,
			},
			type: RECEIVE_CUSTOM_DIMENSION_GATHERING_DATA,
		};
	},

	/**
	 * Receives data available on load state for a custom dimension.
	 *
	 * This action was added to easily manipulate the state for
	 * JS tests and Storybook / VRT scenarios.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string}  parameterName       Custom dimension parameter name.
	 * @param {boolean} dataAvailableOnLoad Data availability on load.
	 * @return {Object} Redux-style action.
	 */
	receiveIsCustomDimensionDataAvailableOnLoad(
		parameterName,
		dataAvailableOnLoad
	) {
		invariant(
			'string' === typeof parameterName,
			'parameterName must be a string.'
		);
		invariant(
			'boolean' === typeof dataAvailableOnLoad,
			'dataAvailableOnLoad must be a boolean.'
		);

		return {
			payload: {
				parameterName,
				dataAvailableOnLoad,
			},
			type: RECEIVE_CUSTOM_DIMENSION_DATA_AVAILABLE_ON_LOAD,
		};
	},
};

const baseControls = {
	[ WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE ]:
		createRegistryControl(
			( registry ) =>
				( { payload: { parameterName } } ) => {
					const dataAvailabityDetermined = () =>
						registry
							.select( MODULES_ANALYTICS_4 )
							.selectCustomDimensionDataAvailability(
								parameterName
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
			const { parameterName, gatheringData } = payload;

			state.customDimensionsGatheringData[ parameterName ] =
				gatheringData;

			break;
		}

		case RECEIVE_CUSTOM_DIMENSION_DATA_AVAILABLE_ON_LOAD: {
			const { parameterName, dataAvailableOnLoad } = payload;

			state.customDimensionsDataAvailableOnLoad[ parameterName ] =
				dataAvailableOnLoad;

			break;
		}

		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*isCustomDimensionGatheringData( parameterName ) {
		const registry = yield Data.commonActions.getRegistry();

		// If the gatheringData flag is already set, return early.
		if (
			registry
				.select( MODULES_ANALYTICS_4 )
				.isCustomDimensionGatheringData( parameterName ) !== undefined
		) {
			return;
		}

		const dataAvailableOnLoad = registry
			.select( MODULES_ANALYTICS_4 )
			.isCustomDimensionDataAvailableOnLoad( parameterName );

		// If dataAvailableOnLoad is true, set gatheringData to false and do nothing else.
		if ( dataAvailableOnLoad ) {
			yield baseActions.receiveIsCustomDimensionGatheringData(
				parameterName,
				false
			);
			return;
		}

		yield {
			payload: {
				parameterName,
			},
			type: WAIT_FOR_CUSTOM_DIMENSION_DATA_AVAILABILITY_STATE,
		};

		const dataAvailability = registry
			.select( MODULES_ANALYTICS_4 )
			.selectCustomDimensionDataAvailability( parameterName );

		yield baseActions.receiveIsCustomDimensionGatheringData(
			parameterName,
			! dataAvailability
		);

		if ( dataAvailability ) {
			yield fetchSaveCustomDimensionDataAvailableStateStore.actions.fetchSaveCustomDimensionDataAvailableState(
				parameterName
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Determines whether data is available for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state         Data store's state.
	 * @param {string} parameterName Custom dimension parameter name.
	 * @return {boolean|undefined|null} Returns TRUE if data is available, otherwise FALSE.
	 *                                  If the request is still being resolved, returns undefined.
	 *                                  If the data availability can not be determined, returns null.
	 */
	selectCustomDimensionDataAvailability: createRegistrySelector(
		( select ) => ( state, parameterName ) => {
			if (
				! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
					parameterName
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
				dimensions: [ `customEvent:${ parameterName }` ],
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
	 * Checks if data is available on load.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state         Data store's state.
	 * @param {string} parameterName Custom dimension parameter name.
	 * @return {boolean} Returns TRUE if data is available on load, otherwise FALSE.
	 */
	isCustomDimensionDataAvailableOnLoad( state, parameterName ) {
		return !! state.customDimensionsDataAvailableOnLoad?.[ parameterName ];
	},

	/**
	 * Determines whether the module is still gathering data or not.
	 *
	 * @todo Review the name of this selector to a less confusing one.
	 * @since n.e.x.t
	 *
	 * @param {Object} state         Data store's state.
	 * @param {string} parameterName Custom dimension parameter name.
	 * @return {boolean|undefined} Returns TRUE if gathering data, otherwise FALSE. If the request is still being resolved, returns undefined.
	 */
	isCustomDimensionGatheringData( state, parameterName ) {
		return state.customDimensionsGatheringData[ parameterName ];
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
