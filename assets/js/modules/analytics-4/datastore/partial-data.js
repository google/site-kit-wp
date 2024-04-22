/**
 * `modules/analytics-4` data store: partial data store.
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
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS_4 } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { getDateString } from '../../../util';

const { createRegistrySelector } = Data;

export const RESOURCE_TYPE_AUDIENCE = 'audience';
export const RESOURCE_TYPE_CUSTOM_DIMENSION = 'customDimension';
export const RESOURCE_TYPE_PROPERTY = 'property';

const RESOURCE_TYPES = [
	RESOURCE_TYPE_AUDIENCE,
	RESOURCE_TYPE_CUSTOM_DIMENSION,
	RESOURCE_TYPE_PROPERTY,
];

const RECEOVE_RESOURCE_DATA_AVAILABILITY_DATES =
	'RECEOVE_RESOURCE_DATA_AVAILABILITY_DATES';
const SET_RESOURCE_DATA_AVAILABILITY_DATE =
	'SET_RESOURCE_DATA_AVAILABILITY_DATE';

const fetchSaveResourceDataAvailabilityDateStore = createFetchStore( {
	baseName: 'saveResourceDataAvailabilityDate',
	controlCallback: ( { resourceSlug, resourceType, date } ) =>
		API.set(
			'modules',
			'analytics-4',
			'save-resource-data-availability-date',
			{
				resourceSlug,
				resourceType,
				date,
			}
		),
	argsToParams: ( resourceSlug, resourceType, date ) => ( {
		resourceSlug,
		resourceType,
		date,
	} ),
	validateParams: ( { resourceSlug, resourceType, date } ) => {
		invariant(
			'string' === typeof resourceSlug && resourceSlug.length > 0,
			'resourceSlug must be a non-empty string.'
		);

		invariant(
			RESOURCE_TYPES.includes( resourceType ),
			'resourceType must be a valid resource type.'
		);

		invariant( Number.isInteger( date ), 'date must be a integer.' );
	},
} );

const baseInitialState = {
	resourceAvailabilityDates: undefined,
};

const baseActions = {
	/**
	 * Receives the data availability dates for all resources.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} resourceAvailabilityDates Resource data availability dates.
	 * @return {Object} Redux-style action.
	 */
	receiveResourceDataAvailabilityDates( resourceAvailabilityDates ) {
		return {
			payload: { resourceAvailabilityDates },
			type: RECEOVE_RESOURCE_DATA_AVAILABILITY_DATES,
		};
	},

	/**
	 * Sets the data availability date for a specific resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 * @param {number} date         Data availability date.
	 * @return {Object} Redux-style action.
	 */
	setResourceDataAvailabilityDate( resourceSlug, resourceType, date ) {
		invariant(
			'string' === typeof resourceSlug && resourceSlug.length > 0,
			'resourceSlug must be a non-empty string.'
		);

		invariant(
			RESOURCE_TYPES.includes( resourceType ),
			'resourceType must be a valid resource type.'
		);

		invariant( Number.isInteger( date ), 'date must be a integer.' );

		return {
			payload: { resourceSlug, resourceType, date },
			type: SET_RESOURCE_DATA_AVAILABILITY_DATE,
		};
	},

	/**
	 * Determines the data availability date for a specific resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 */
	*determineResourceDataAvailabilityDate( resourceSlug, resourceType ) {
		const { select, __experimentalResolveSelect } =
			yield Data.commonActions.getRegistry();

		// Handle for custom dimensions.
		yield Data.commonActions.await(
			__experimentalResolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		// If resourceType is custom dimension, check if custom dimension is available in settings.
		if ( resourceType === RESOURCE_TYPE_CUSTOM_DIMENSION ) {
			// Return early if custom dimension is not available in settings.
			if (
				! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
					resourceSlug
				)
			) {
				return;
			}
		}

		yield Data.commonActions.await(
			__experimentalResolveSelect( CORE_USER ).getAuthentication()
		);

		// Return early if user is not authenticated.
		if ( ! select( CORE_USER ).isAuthenticated() ) {
			return;
		}

		const reportArgs = yield Data.commonActions.await(
			__experimentalResolveSelect(
				MODULES_ANALYTICS_4
			).getPartialDataReportOptions( resourceSlug, resourceType )
		);

		// Return early if reportArgs is not available.
		if ( ! reportArgs ) {
			return;
		}

		const report = yield Data.commonActions.await(
			__experimentalResolveSelect( MODULES_ANALYTICS_4 ).getReport(
				reportArgs
			)
		);

		const hasReportError = !! select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ reportArgs ] );

		global.console.log( {
			report,
			hasReportError,
		} );

		const isDataAvailable =
			! hasReportError &&
			report?.rows?.[ 0 ]?.dimensionValues?.[ 0 ]?.value?.length;

		if ( isDataAvailable ) {
			const dataAvailabilityDate = Number(
				report.rows[ 0 ].dimensionValues[ 0 ].value
			);

			yield baseActions.setResourceDataAvailabilityDate(
				resourceSlug,
				resourceType,
				dataAvailabilityDate
			);

			// yield fetchSaveResourceDataAvailabilityDateStore.actions.fetchSaveResourceDataAvailabilityDate(
			// 	resourceSlug,
			// 	resourceType,
			// 	dataAvailabilityDate
			// );
		}
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEOVE_RESOURCE_DATA_AVAILABILITY_DATES: {
			const { resourceAvailabilityDates } = payload;

			state.resourceAvailabilityDates = resourceAvailabilityDates;
			break;
		}

		case SET_RESOURCE_DATA_AVAILABILITY_DATE: {
			const { resourceSlug, resourceType, date } = payload;

			if ( state.resourceAvailabilityDates === undefined ) {
				state.resourceAvailabilityDates = {};
			}

			if (
				state.resourceAvailabilityDates[ resourceType ] === undefined
			) {
				state.resourceAvailabilityDates[ resourceType ] = {};
			}

			state.resourceAvailabilityDates[ resourceType ][ resourceSlug ] =
				date;
			break;
		}

		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*getResourceDataAvailabilityDates() {
		const { select } = yield Data.commonActions.getRegistry();

		if (
			select( MODULES_ANALYTICS_4 ).getResourceDataAvailabilityDates() !==
			undefined
		) {
			return;
		}

		const resourceAvailabilityDatesOnLoad =
			global._googlesitekitModulesData?.[ 'analytics-4' ]
				?.resourceAvailabilityDates;

		if ( resourceAvailabilityDatesOnLoad ) {
			yield baseActions.receiveResourceDataAvailabilityDates(
				resourceAvailabilityDatesOnLoad
			);
		}
	},

	*getResourceDataAvailabilityDate( resourceSlug, resourceType ) {
		const { select, __experimentalResolveSelect } =
			yield Data.commonActions.getRegistry();

		if (
			select( MODULES_ANALYTICS_4 ).getResourceDataAvailabilityDate(
				resourceSlug,
				resourceType
			) !== undefined
		) {
			return;
		}

		const resourceAvailabilityDates = yield Data.commonActions.await(
			__experimentalResolveSelect(
				MODULES_ANALYTICS_4
			).getResourceDataAvailabilityDates()
		);

		if (
			resourceAvailabilityDates[ resourceType ][ resourceSlug ] ===
			undefined
		) {
			global.console.log(
				'setting temporary data availability date to 0'
			);
			yield baseActions.setResourceDataAvailabilityDate(
				resourceSlug,
				resourceType,
				0
			);
			global.console.log( 'determining data availability date' );
			yield baseActions.determineResourceDataAvailabilityDate(
				resourceSlug,
				resourceType
			);
		}
	},

	*isResourcePartialData( resourceSlug, resourceType ) {
		const { select, __experimentalResolveSelect } =
			yield Data.commonActions.getRegistry();

		if (
			select( MODULES_ANALYTICS_4 ).isResourcePartialData(
				resourceSlug,
				resourceType
			) !== undefined
		) {
			return;
		}

		const dataAvailabilityDate = yield Data.commonActions.await(
			__experimentalResolveSelect(
				MODULES_ANALYTICS_4
			).getResourceDataAvailabilityDate( resourceSlug, resourceType )
		);

		// If the data availability date for the given resource is 0,
		// We need to determine the date by making a report request.
		if ( dataAvailabilityDate === 0 ) {
			yield baseActions.determineResourceDataAvailabilityDate(
				resourceSlug,
				resourceType
			);
		}
	},

	*getPartialDataReportOptions() {
		const { __experimentalResolveSelect } =
			yield Data.commonActions.getRegistry();

		yield Data.commonActions.await(
			__experimentalResolveSelect(
				MODULES_ANALYTICS_4
			).getPropertyCreateTime()
		);
	},
};

const baseSelectors = {
	/**
	 * Gets the data availability date for all resources.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Resource data availability dates. Undefined if not loaded.
	 */
	getResourceDataAvailabilityDates( state ) {
		return state.resourceAvailabilityDates;
	},

	/**
	 * Gets the data availability date for a specific resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 * @return {number} Resource data availability date. Undefined if not loaded.
	 */
	getResourceDataAvailabilityDate( state, resourceSlug, resourceType ) {
		return state.resourceAvailabilityDates?.[ resourceType ]?.[
			resourceSlug
		];
	},

	/**
	 * Gets whether the given resource is in partial data state.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 * @return {boolean} Returns TRUE if partial data, otherwise FALSE or undefined while loading.
	 */
	isResourcePartialData: createRegistrySelector(
		( select ) => ( state, resourceSlug, resourceType ) => {
			const analyticsGatheringData =
				select( MODULES_ANALYTICS_4 ).isGatheringData();

			if ( analyticsGatheringData === undefined ) {
				return undefined;
			}

			// If the GA property is in gathering data state, the resource is in partial data state.
			if ( analyticsGatheringData ) {
				return true;
			}

			const dataAvailabilityDate = select(
				MODULES_ANALYTICS_4
			).getResourceDataAvailabilityDate( resourceSlug, resourceType );

			if ( dataAvailabilityDate === undefined ) {
				return undefined;
			}

			// Assume partial data if the data availability date is not available.
			if ( dataAvailabilityDate === 0 ) {
				return true;
			}

			const { startDate } = select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

			const startDateYYYYMMDD = Number( startDate.replaceAll( '-', '' ) );

			global.console.log( {
				dataAvailabilityDate,
				startDate: startDateYYYYMMDD,
				isParialData: dataAvailabilityDate > startDateYYYYMMDD,
			} );

			return dataAvailabilityDate > startDateYYYYMMDD;
		}
	),

	/**
	 * Gets whether the given audience is in partial data state.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} audienceSlug Audience slug.
	 * @return {boolean} Returns TRUE if partial data, otherwise FALSE or undefined while loading.
	 */
	isAudiencePartialData: createRegistrySelector(
		( select ) => ( state, audienceSlug ) =>
			select( MODULES_ANALYTICS_4 ).isResourcePartialData(
				audienceSlug,
				RESOURCE_TYPE_AUDIENCE
			)
	),

	/**
	 * Gets whether the given custom dimension is in partial data state.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} customDimensionSlug Custom dimension slug.
	 * @return {boolean} Returns TRUE if partial data, otherwise FALSE or undefined while loading.
	 */
	isCustomDimensionPartialData: createRegistrySelector(
		( select ) => ( state, customDimensionSlug ) =>
			select( MODULES_ANALYTICS_4 ).isResourcePartialData(
				customDimensionSlug,
				RESOURCE_TYPE_CUSTOM_DIMENSION
			)
	),

	/**
	 * Gets whether the given property is in partial data state.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID Property ID.
	 * @return {boolean} Returns TRUE if partial data, otherwise FALSE or undefined while loading.
	 */
	isPropertyPartialData: createRegistrySelector(
		( select ) => ( state, propertyID ) =>
			select( MODULES_ANALYTICS_4 ).isResourcePartialData(
				propertyID,
				RESOURCE_TYPE_PROPERTY
			)
	),
	/**
	 * Gets report options for determining data availability date for a given resource.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 * @return {Object|undefined} Report options for determining data availability date. Undefined if not available.
	 */
	getPartialDataReportOptions: createRegistrySelector(
		( select ) => ( state, resourceSlug, resourceType ) => {
			invariant(
				typeof resourceSlug === 'string',
				'resourceSlug must be a string.'
			);
			invariant(
				RESOURCE_TYPES.includes( resourceType ),
				'resourceType must be a valid resource type.'
			);

			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			if ( ! propertyID ) {
				return undefined;
			}

			const propertyCreateTime =
				select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();

			const endDate = select( CORE_USER ).getReferenceDate();

			switch ( resourceType ) {
				case RESOURCE_TYPE_CUSTOM_DIMENSION:
					return {
						startDate: getDateString(
							new Date( propertyCreateTime )
						),
						endDate,
						dimensions: [ 'date', `customEvent:${ resourceSlug }` ],
						metrics: [ { name: 'eventCount' } ],
						limit: 1,
					};

				case RESOURCE_TYPE_AUDIENCE:
					return {
						startDate: getDateString(
							new Date( propertyCreateTime )
						),
						endDate,
						dimensions: [
							'date',
							'audienceResourceName',
							'audienceName',
						],
						metrics: [ { name: 'totalUsers' } ],
						limit: 1,
					};

				case RESOURCE_TYPE_PROPERTY:
					return {
						startDate: getDateString(
							new Date( propertyCreateTime )
						),
						endDate,
						dimensions: [ 'date' ],
						metrics: [ { name: 'totalUsers' } ],
						limit: 1,
					};
			}
		}
	),
};

const store = Data.combineStores( fetchSaveResourceDataAvailabilityDateStore, {
	actions: baseActions,
	controls: baseControls,
	initialState: baseInitialState,
	reducer: baseReducer,
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
