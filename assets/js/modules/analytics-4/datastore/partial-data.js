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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { getDateString, getPreviousDate } from '../../../util';
import {
	CUSTOM_DIMENSION_DEFINITIONS,
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from './constants';

const { createRegistrySelector } = Data;

export const RESOURCE_TYPE_AUDIENCE = 'audience';
export const RESOURCE_TYPE_CUSTOM_DIMENSION = 'customDimension';
export const RESOURCE_TYPE_PROPERTY = 'property';

const RESOURCE_TYPES = [
	RESOURCE_TYPE_AUDIENCE,
	RESOURCE_TYPE_CUSTOM_DIMENSION,
	RESOURCE_TYPE_PROPERTY,
];

const MAX_INITIAL_AUDIENCES = 2;

const RECEIVE_RESOURCE_DATA_AVAILABILITY_DATES =
	'RECEIVE_RESOURCE_DATA_AVAILABILITY_DATES';
const SET_RESOURCE_DATA_AVAILABILITY_DATE =
	'SET_RESOURCE_DATA_AVAILABILITY_DATE';

/**
 * Retrieves user counts for the provided audiences, filters to those with data over the given date range,
 * sorts them by total users, and returns the audienceResourceNames in that order.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry  Registry object.
 * @param {Array}  audiences Array of available audiences.
 * @param {string} startDate Start date for the report.
 * @param {string} endDate   End date for the report.
 * @return {Object} Object with audienceResourceNames array and error if any.
 */
async function getNonZeroDataAudiencesSortedByTotalUsers(
	registry,
	audiences,
	startDate,
	endDate
) {
	const { select, __experimentalResolveSelect } = registry;

	const reportOptions = {
		metrics: [ { name: 'totalUsers' } ],
		dimensions: [ 'audienceResourceName' ],
		dimensionFilters: {
			audienceResourceName: audiences.map( ( { name } ) => name ),
		},
		startDate,
		endDate,
	};

	const report = await __experimentalResolveSelect(
		MODULES_ANALYTICS_4
	).getReport( reportOptions );

	const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
		'getReport',
		[ reportOptions ]
	);

	if ( error ) {
		// TODO: Full error handling will be implemented via https://github.com/google/site-kit-wp/issues/8134.
		return { error };
	}

	const sortedRows = [ ...( report.rows || [] ) ].sort(
		( rowA, rowB ) =>
			( rowB.metricValues?.[ 0 ]?.value || 0 ) - // `value` is `totalUsers`.
			( rowA.metricValues?.[ 0 ]?.value || 0 )
	);

	// Rows without data shouldn't actually be returned in the report, but to be safe, filter them out if present.
	const rowsWithData = sortedRows.filter(
		( { metricValues } ) => metricValues?.[ 0 ]?.value > 0
	);

	return {
		audienceResourceNames: rowsWithData.map(
			( { dimensionValues } ) => dimensionValues?.[ 0 ]?.value // `value` is `audienceResourceName`.
		),
	};
}

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
		invariant(
			isPlainObject( resourceAvailabilityDates ),
			'resourceAvailabilityDates must be a plain object.'
		);

		return {
			payload: { resourceAvailabilityDates },
			type: RECEIVE_RESOURCE_DATA_AVAILABILITY_DATES,
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

		invariant( Number.isInteger( date ), 'date must be an integer.' );

		return {
			payload: { resourceSlug, resourceType, date },
			type: SET_RESOURCE_DATA_AVAILABILITY_DATE,
		};
	},

	/**
	 * Populates the configured audiences with the top 2 user audiences and/or the Site Kit-created audiences,
	 * depending on their availability and suitability (data over the last 90 days is required for user audiences).
	 *
	 * If no suitable audiences are available, creates the "new-visitors" and "returning-visitors" audiences.
	 * If the `googlesitekit_post_type` custom dimension doesn't exist, creates it.
	 *
	 * @since n.e.x.t
	 */
	*enableAudienceGroup() {
		const registry = yield Data.commonActions.getRegistry();

		const { dispatch, select, __experimentalResolveSelect } = registry;

		const { response: availableAudiences, error: syncError } =
			yield Data.commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences()
			);

		if ( syncError ) {
			// TODO: Full error handling will be implemented via https://github.com/google/site-kit-wp/issues/8134.
			return;
		}

		const userAudiences = availableAudiences.filter(
			( { audienceType } ) => audienceType === 'USER_AUDIENCE'
		);

		const configuredAudiences = [];

		if ( userAudiences.length > 0 ) {
			// If there are user audiences, filter and sort them by total users over the last 90 days,
			// and add the top 2 (MAX_INITIAL_AUDIENCES) which have users to the configured audiences.

			const endDate = select( CORE_USER ).getReferenceDate();

			const startDate = getPreviousDate(
				endDate,
				90 + DATE_RANGE_OFFSET // Add offset to ensure we have data for the entirety of the last 90 days.
			);

			const { audienceResourceNames, error } =
				yield Data.commonActions.await(
					getNonZeroDataAudiencesSortedByTotalUsers(
						registry,
						userAudiences,
						startDate,
						endDate
					)
				);

			if ( ! error ) {
				// TODO: Full error handling will be implemented via https://github.com/google/site-kit-wp/issues/8134.
				configuredAudiences.push(
					...audienceResourceNames.slice( 0, MAX_INITIAL_AUDIENCES )
				);
			}
		}

		if ( configuredAudiences.length < MAX_INITIAL_AUDIENCES ) {
			// If there are less than 2 (MAX_INITIAL_AUDIENCES) configured user audiences, add the Site Kit-created audiences if they exist,
			// up to the limit of 2.

			const siteKitAudiences = availableAudiences.filter(
				( { audienceType } ) => audienceType === 'SITE_KIT_AUDIENCE'
			);

			// Audience slugs to sort by:
			const sortedSlugs = [ 'new-visitors', 'returning-visitors' ];

			const sortedSiteKitAudiences = siteKitAudiences.sort(
				( audienceA, audienceB ) => {
					const indexA = sortedSlugs.indexOf(
						audienceA.audienceSlug
					);
					const indexB = sortedSlugs.indexOf(
						audienceB.audienceSlug
					);

					return indexA - indexB;
				}
			);

			const audienceResourceNames = sortedSiteKitAudiences
				.slice( 0, MAX_INITIAL_AUDIENCES - configuredAudiences.length )
				.map( ( { name } ) => name );

			configuredAudiences.push( ...audienceResourceNames );
		}

		if ( configuredAudiences.length === 0 ) {
			// If there are no configured audiences by this points, create the "new-visitors" and "returning-visitors" audiences,
			// and add them to the configured audiences.
			const [ newVisitorsResult, returningVisitorsResult ] =
				yield Data.commonActions.await(
					Promise.all( [
						dispatch( MODULES_ANALYTICS_4 ).createAudience(
							SITE_KIT_AUDIENCE_DEFINITIONS[ 'new-visitors' ]
						),
						dispatch( MODULES_ANALYTICS_4 ).createAudience(
							SITE_KIT_AUDIENCE_DEFINITIONS[
								'returning-visitors'
							]
						),
					] )
				);

			// TODO: Full error handling will be implemented via https://github.com/google/site-kit-wp/issues/8134.
			if ( ! newVisitorsResult.error ) {
				configuredAudiences.push( newVisitorsResult.response.name );
			}

			if ( ! returningVisitorsResult.error ) {
				configuredAudiences.push(
					returningVisitorsResult.response.name
				);
			}

			// Resync available audiences to ensure the newly created audiences are available.
			yield Data.commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences()
			);
		}

		// Create custom dimension if it doesn't exist.
		yield Data.commonActions.await(
			__experimentalResolveSelect(
				MODULES_ANALYTICS_4
			).getAvailableCustomDimensions()
		);

		if (
			! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				'googlesitekit_post_type'
			)
		) {
			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			const { error } = yield Data.commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).fetchCreateCustomDimension(
					propertyID,
					CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type
				)
			);

			if ( error ) {
				// TODO: Full error handling will be implemented via https://github.com/google/site-kit-wp/issues/8134.
			} else {
				// If the custom dimension was created successfully, mark it as gathering
				// data immediately so that it doesn't cause unnecessary report requests.
				dispatch(
					MODULES_ANALYTICS_4
				).receiveIsCustomDimensionGatheringData(
					'googlesitekit_post_type',
					true
				);

				// Resync available custom dimensions to ensure the newly created custom dimension is available.
				yield Data.commonActions.await(
					dispatch(
						MODULES_ANALYTICS_4
					).fetchSyncAvailableCustomDimensions()
				);
			}
		}

		dispatch( MODULES_ANALYTICS_4 ).setConfiguredAudiences(
			configuredAudiences
		);

		const { error } = yield Data.commonActions.await(
			dispatch( MODULES_ANALYTICS_4 ).saveAudienceSettings()
		);

		if ( error ) {
			// TODO: Full error handling will be implemented via https://github.com/google/site-kit-wp/issues/8134.
		}
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_RESOURCE_DATA_AVAILABILITY_DATES: {
			const { resourceAvailabilityDates } = payload;

			// Replace empty array value with empty object in resourceAvailabilityDates object.
			Object.keys( resourceAvailabilityDates ).forEach( ( key ) => {
				if ( Array.isArray( resourceAvailabilityDates[ key ] ) ) {
					resourceAvailabilityDates[ key ] = {};
				}
			} );

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
			// Ensure the settings are loaded.
			yield Data.commonActions.await(
				__experimentalResolveSelect( MODULES_ANALYTICS_4 ).getSettings()
			);

			// Validate if the resourceSlug is a valid resource.
			switch ( resourceType ) {
				case RESOURCE_TYPE_AUDIENCE:
					yield Data.commonActions.await(
						__experimentalResolveSelect(
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

			yield Data.commonActions.await(
				__experimentalResolveSelect( CORE_USER ).getAuthentication()
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
			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			if ( ! propertyID ) {
				return undefined;
			}

			const propertyCreateTime =
				select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();

			if ( ! propertyCreateTime ) {
				return undefined;
			}

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
