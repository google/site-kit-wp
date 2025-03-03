/**
 * `modules/analytics-4` data store: partial data store.
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
} from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { getDateString } from '../../../util';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS_4 } from './constants';

export const RESOURCE_TYPE_AUDIENCE = 'audience';
export const RESOURCE_TYPE_CUSTOM_DIMENSION = 'customDimension';
export const RESOURCE_TYPE_PROPERTY = 'property';

const RESOURCE_TYPES = [
	RESOURCE_TYPE_AUDIENCE,
	RESOURCE_TYPE_CUSTOM_DIMENSION,
	RESOURCE_TYPE_PROPERTY,
];

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

		invariant( Number.isInteger( date ), 'date must be an integer.' );
	},
} );

const baseActions = {
	/**
	 * Sets the data availability date for a specific resource.
	 *
	 * @since 1.127.0
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

		invariant( Number.isInteger( date ), 'date must be an integer.' );

		return {
			payload: { resourceSlug, resourceType, date },
			type: SET_RESOURCE_DATA_AVAILABILITY_DATE,
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_RESOURCE_DATA_AVAILABILITY_DATE: {
			const { resourceSlug, resourceType, date } = payload;

			if ( state.moduleData.resourceAvailabilityDates === undefined ) {
				state.moduleData.resourceAvailabilityDates = {};
			}

			if (
				state.moduleData.resourceAvailabilityDates[ resourceType ] ===
				undefined
			) {
				state.moduleData.resourceAvailabilityDates[ resourceType ] = {};
			}

			state.moduleData.resourceAvailabilityDates[ resourceType ][
				resourceSlug
			] = date;
			break;
		}

		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*getResourceDataAvailabilityDate( resourceSlug, resourceType ) {
		const { select, resolveSelect } = yield commonActions.getRegistry();

		if (
			select( MODULES_ANALYTICS_4 ).getResourceDataAvailabilityDate(
				resourceSlug,
				resourceType
			) !== undefined
		) {
			return;
		}

		if ( select( MODULES_ANALYTICS_4 ).getModuleData() === undefined ) {
			// Module data needs to be resolved to determine the resource data availability date.
			yield commonActions.await(
				resolveSelect( MODULES_ANALYTICS_4 ).getModuleData()
			);
		}

		const resourceAvailabilityDates =
			select( MODULES_ANALYTICS_4 ).getResourceDataAvailabilityDates();

		if (
			resourceAvailabilityDates[ resourceType ][ resourceSlug ] ===
			undefined
		) {
			// Ensure the settings are loaded.
			yield commonActions.await(
				resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
			);

			// Validate if the resourceSlug is a valid resource.
			switch ( resourceType ) {
				case RESOURCE_TYPE_AUDIENCE:
					yield commonActions.await(
						resolveSelect(
							MODULES_ANALYTICS_4
						).getAvailableAudiences()
					);

					if (
						! select( MODULES_ANALYTICS_4 ).hasAudiences(
							resourceSlug
						)
					) {
						return;
					}
					break;

				case RESOURCE_TYPE_CUSTOM_DIMENSION:
					if (
						! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
							resourceSlug
						)
					) {
						return;
					}
					break;

				case RESOURCE_TYPE_PROPERTY:
					if (
						select( MODULES_ANALYTICS_4 ).getPropertyID() !==
						resourceSlug
					) {
						return;
					}
					break;

				default:
					return;
			}

			yield commonActions.await(
				resolveSelect( CORE_USER ).getAuthentication()
			);

			// Return early if user is not authenticated.
			if ( ! select( CORE_USER ).isAuthenticated() ) {
				yield baseActions.setResourceDataAvailabilityDate(
					resourceSlug,
					resourceType,
					0
				);
				return;
			}

			const reportArgs = yield commonActions.await(
				resolveSelect(
					MODULES_ANALYTICS_4
				).getPartialDataReportOptions( resourceSlug, resourceType )
			);

			// Return early if reportArgs is not available.
			if ( ! reportArgs ) {
				return;
			}

			const report = yield commonActions.await(
				resolveSelect( MODULES_ANALYTICS_4 ).getReport( reportArgs )
			);

			const hasReportError = !! select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ reportArgs ] );

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

				yield fetchSaveResourceDataAvailabilityDateStore.actions.fetchSaveResourceDataAvailabilityDate(
					resourceSlug,
					resourceType,
					dataAvailabilityDate
				);
			} else {
				yield baseActions.setResourceDataAvailabilityDate(
					resourceSlug,
					resourceType,
					0
				);
			}
		}
	},

	*getPartialDataReportOptions() {
		const { resolveSelect } = yield commonActions.getRegistry();

		yield commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getPropertyCreateTime()
		);
	},
};

const baseSelectors = {
	/**
	 * Gets the data availability date for a specific resource.
	 *
	 * @since 1.127.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 * @return {number} Resource data availability date. Undefined if not loaded.
	 */
	getResourceDataAvailabilityDate( state, resourceSlug, resourceType ) {
		return state.moduleData.resourceAvailabilityDates?.[ resourceType ]?.[
			resourceSlug
		];
	},

	/**
	 * Gets whether the given resource is in partial data state.
	 *
	 * @since 1.127.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 * @return {boolean} Returns TRUE if partial data, otherwise FALSE or undefined while loading.
	 */
	isResourcePartialData: createRegistrySelector(
		( select ) => ( state, resourceSlug, resourceType ) => {
			invariant(
				'string' === typeof resourceSlug && resourceSlug.length > 0,
				'resourceSlug must be a non-empty string.'
			);
			invariant(
				RESOURCE_TYPES.includes( resourceType ),
				'resourceType must be a valid resource type.'
			);

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

			// TODO: use `replaceAll` instead when we upgrade our Node version.
			const startDateYYYYMMDD = Number( startDate.replace( /-/g, '' ) );

			return dataAvailabilityDate > startDateYYYYMMDD;
		}
	),

	/**
	 * Gets whether the given audience is in partial data state.
	 *
	 * @since 1.127.0
	 *
	 * @param {Object} state                Data store's state.
	 * @param {string} audienceResourceName Audience resource name.
	 * @return {boolean} Returns TRUE if partial data, otherwise FALSE or undefined while loading.
	 */
	isAudiencePartialData: createRegistrySelector(
		( select ) => ( state, audienceResourceName ) =>
			select( MODULES_ANALYTICS_4 ).isResourcePartialData(
				audienceResourceName,
				RESOURCE_TYPE_AUDIENCE
			)
	),

	/**
	 * Gets whether the given custom dimension is in partial data state.
	 *
	 * @since 1.127.0
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
	 * @since 1.127.0
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
	 * @since 1.127.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {string} resourceSlug Resource slug.
	 * @param {string} resourceType Resource type.
	 * @return {Object|undefined} Report options for determining data availability date. Undefined if not available.
	 */
	getPartialDataReportOptions: createRegistrySelector(
		( select ) => ( state, resourceSlug, resourceType ) => {
			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			if ( ! propertyID ) {
				return undefined;
			}

			const propertyCreateTime =
				select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();

			if ( ! propertyCreateTime ) {
				return undefined;
			}

			// Valid use of `new Date()` with an argument.
			// eslint-disable-next-line sitekit/no-direct-date
			const startDate = getDateString( new Date( propertyCreateTime ) );
			const endDate = select( CORE_USER ).getReferenceDate();

			switch ( resourceType ) {
				case RESOURCE_TYPE_AUDIENCE:
					return {
						startDate,
						endDate,
						dimensions: [ 'date', 'audienceResourceName' ],
						dimensionFilters: {
							audienceResourceName: resourceSlug,
						},
						metrics: [ 'totalUsers' ],
						orderby: [
							{
								dimension: {
									dimensionName: 'date',
								},
							},
						],
						limit: 1,
					};

				case RESOURCE_TYPE_CUSTOM_DIMENSION:
					return {
						startDate,
						endDate,
						dimensions: [ 'date', `customEvent:${ resourceSlug }` ],
						metrics: [ 'eventCount' ],
						limit: 1,
					};

				case RESOURCE_TYPE_PROPERTY:
					return {
						startDate,
						endDate,
						dimensions: [ 'date' ],
						metrics: [ 'totalUsers' ],
						limit: 1,
					};
			}
		}
	),
};

const store = combineStores( fetchSaveResourceDataAvailabilityDateStore, {
	actions: baseActions,
	controls: baseControls,
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
