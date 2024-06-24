/**
 * `modules/analytics-4` data store: audiences.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS_4,
	CUSTOM_DIMENSION_DEFINITIONS,
	DATE_RANGE_OFFSET,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { getPreviousDate } from '../../../util';
import { validateAudience } from '../utils/validation';

const { createRegistrySelector } = Data;

const MAX_INITIAL_AUDIENCES = 2;

/**
 * Retrieves user counts for the provided audiences, filters to those with data over the given date range,
 * sorts them by total users, and returns the audienceResourceNames in that order.
 *
 * @since 1.128.0
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

	const reportOptions = select(
		MODULES_ANALYTICS_4
	).getAudiencesUserCountReportOptions( audiences, { startDate, endDate } );

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

const fetchCreateAudienceStore = createFetchStore( {
	baseName: 'createAudience',
	controlCallback: ( { audience } ) =>
		API.set( 'modules', 'analytics-4', 'create-audience', {
			audience,
		} ),
	argsToParams: ( audience ) => ( {
		audience,
	} ),
	validateParams: ( { audience } ) => {
		validateAudience( audience );
	},
} );

const fetchSyncAvailableAudiencesStore = createFetchStore( {
	baseName: 'syncAvailableAudiences',
	controlCallback: () =>
		API.set( 'modules', 'analytics-4', 'sync-audiences' ),
	reducerCallback: ( state, audiences ) => {
		return {
			...state,
			settings: {
				...state.settings,
				availableAudiences: [ ...audiences ],
			},
		};
	},
} );

const baseActions = {
	/**
	 * Creates new property audience.
	 *
	 * @since 1.120.0
	 *
	 * @param {Object} audience                             The property audience parameters.
	 * @param {string} [audience.displayName]               Required. The display name of the Audience.
	 * @param {string} [audience.description]               Required. The description of the Audience.
	 * @param {number} [audience.membershipDurationDays]    Required. The duration a user should stay in an Audience. Cannot be more than 540 days.
	 * @param {Array}  [audience.filterClauses]             Required. Filter clauses array of <AudienceFilterClause> objects that define the Audience.
	 * @param {Object} [audience.eventTrigger]              Optional. Specifies an event to log when a user joins the Audience.
	 * @param {string} [audience.eventTrigger.eventName]    Required if `eventTrigger` is provided. The event name that will be logged.
	 * @param {string} [audience.eventTrigger.logCondition] Required if `eventTrigger` is provided. When to log the event. Acceptable values:
	 *                                                      - 'LOG_CONDITION_UNSPECIFIED': Log condition is not specified.
	 *                                                      - 'AUDIENCE_JOINED': The event should be logged only when a user is joined.
	 *                                                      - 'AUDIENCE_MEMBERSHIP_RENEWED': The event should be logged whenever the Audience condition is met, even if the user is already a member of the Audience.
	 * @param {string} [audience.exclusionDurationMode]     Optional. Specifies how long an exclusion lasts for users that meet the exclusion filter. Acceptable values:
	 *                                                      - 'AUDIENCE_EXCLUSION_DURATION_MODE_UNSPECIFIED': Not specified.
	 *                                                      - 'EXCLUDE_TEMPORARILY': Exclude users from the Audience during periods when they meet the filter clause.
	 *                                                      - 'EXCLUDE_PERMANENTLY': Exclude users from the Audience if they've ever met the filter clause.
	 * @return {Object} Object with `response` and `error`.
	 */
	createAudience: createValidatedAction(
		validateAudience,
		function* ( audience ) {
			const { response, error } =
				yield fetchCreateAudienceStore.actions.fetchCreateAudience(
					audience
				);

			return { response, error };
		}
	),

	/**
	 * Syncs available audiences from the Analytics service.
	 *
	 * @since 1.126.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*syncAvailableAudiences() {
		const { response, error } =
			yield fetchSyncAvailableAudiencesStore.actions.fetchSyncAvailableAudiences();

		return { response, error };
	},

	/**
	 * Populates the configured audiences with the top two user audiences and/or the Site Kit-created audiences,
	 * depending on their availability and suitability (data over the last 90 days is required for user audiences).
	 *
	 * If no suitable audiences are available, creates the "new-visitors" and "returning-visitors" audiences.
	 * If the `googlesitekit_post_type` custom dimension doesn't exist, creates it.
	 *
	 * @since 1.128.0
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
			// and add the top two (MAX_INITIAL_AUDIENCES) which have users to the configured audiences.

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
			// If there are less than two (MAX_INITIAL_AUDIENCES) configured user audiences, add the Site Kit-created audiences if they exist,
			// up to the limit of two.

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
			// If there are no configured audiences by this point, create the "new-visitors" and "returning-visitors" audiences,
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

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAvailableAudiences() {
		const registry = yield Data.commonActions.getRegistry();

		const audiences = registry
			.select( MODULES_ANALYTICS_4 )
			.getAvailableAudiences();

		// If available audiences not present, sync the audience in state.
		if ( audiences === null ) {
			yield fetchSyncAvailableAudiencesStore.actions.fetchSyncAvailableAudiences();
		}
	},
};

const baseSelectors = {
	/**
	 * Checks if the given audience is a default audience.
	 *
	 * @since 1.127.0
	 *
	 * @param {string} audienceResourceName The audience resource name.
	 * @param {Object} state                Data store's state.
	 * @return {(boolean|undefined)} `true` if the audience is a default audience, `false` if not, `undefined` if not loaded.
	 */
	isDefaultAudience: createRegistrySelector(
		( select ) => ( state, audienceResourceName ) => {
			const availableAudiences =
				select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

			if ( availableAudiences === undefined ) {
				return undefined;
			}

			const audience = availableAudiences.find(
				( { name } ) => name === audienceResourceName
			);

			return audience?.audienceType === 'DEFAULT_AUDIENCE';
		}
	),

	/**
	 * Checks if the given audience is a Site Kit-created audience.
	 *
	 * @since 1.127.0
	 *
	 * @param {string} audienceResourceName The audience resource name.
	 * @param {Object} state                Data store's state.
	 * @return {(boolean|undefined)} `true` if the audience is a Site Kit-created audience, `false` if not, `undefined` if not loaded.
	 */
	isSiteKitAudience: createRegistrySelector(
		( select ) => ( state, audienceResourceName ) => {
			const availableAudiences =
				select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

			if ( availableAudiences === undefined ) {
				return undefined;
			}

			const audience = availableAudiences.find(
				( { name } ) => name === audienceResourceName
			);

			return audience?.audienceType === 'SITE_KIT_AUDIENCE';
		}
	),

	/**
	 * Checks if the given audience is a user-defined audience.
	 *
	 * @since 1.127.0
	 *
	 * @param {string} audienceResourceName The audience resource name.
	 * @param {Object} state                Data store's state.
	 * @return {(boolean|undefined)} `true` if the audience is a user-defined audience, `false` if not, `undefined` if not loaded.
	 */
	isUserAudience: createRegistrySelector(
		( select ) => ( state, audienceResourceName ) => {
			const availableAudiences =
				select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

			if ( availableAudiences === undefined ) {
				return undefined;
			}

			const audience = availableAudiences.find(
				( { name } ) => name === audienceResourceName
			);

			return audience?.audienceType === 'USER_AUDIENCE';
		}
	),

	/**
	 * Checks whether the provided audiences are available.
	 *
	 * @since 1.127.0
	 *
	 * @param {Object}               state                 Data store's state.
	 * @param {string|Array<string>} audienceResourceNames The audience resource names to check.
	 * @return {boolean} True if all provided audiences are available, otherwise false. Undefined if available audiences are not loaded yet.
	 */
	hasAudiences: createRegistrySelector(
		( select ) => ( state, audienceResourceNames ) => {
			const audiencesToCheck = Array.isArray( audienceResourceNames )
				? audienceResourceNames
				: [ audienceResourceNames ];

			const availableAudiences =
				select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

			if ( availableAudiences === undefined ) {
				return undefined;
			}

			if ( availableAudiences === null ) {
				return false;
			}

			return audiencesToCheck.every( ( audienceResourceName ) =>
				availableAudiences.some(
					( { name } ) => name === audienceResourceName
				)
			);
		}
	),

	/**
	 * Gets the available configurable audiences.
	 *
	 * This selector filters out the "Purchasers" audience if it has no data.
	 *
	 * @since 1.129.0
	 *
	 * @return {(Array|undefined)} Array of configurable audiences. Undefined if available audiences are not loaded yet.
	 */
	getConfigurableAudiences: createRegistrySelector( ( select ) => () => {
		const { getAvailableAudiences, getResourceDataAvailabilityDate } =
			select( MODULES_ANALYTICS_4 );

		const availableAudiences = getAvailableAudiences();

		if ( availableAudiences === undefined ) {
			return undefined;
		}

		if ( ! Array.isArray( availableAudiences ) ) {
			return [];
		}

		return (
			availableAudiences
				// Filter out "Purchasers" audience if it has no data.
				.filter( ( { audienceSlug, name } ) => {
					if ( 'purchasers' !== audienceSlug ) {
						return true;
					}

					return !! getResourceDataAvailabilityDate(
						name,
						'audience'
					);
				} )
		);
	} ),

	/**
	 * Gets the options for the audiences user count report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state             Data store's state.
	 * @param {Array}  audiences         Array of available audiences.
	 * @param {Object} options           Optional. Options to pass to the selector.
	 * @param {string} options.startDate Start date for the report.
	 * @param {string} options.endDate   End date for the report.
	 * @return {Object} Returns the report options for the audiences user count report.
	 */
	getAudiencesUserCountReportOptions: createRegistrySelector(
		( select ) =>
			( state, audiences, { startDate, endDate } = {} ) => {
				const dateRangeDates = select( CORE_USER ).getDateRangeDates( {
					offsetDays: DATE_RANGE_OFFSET,
				} );

				return {
					startDate: startDate || dateRangeDates.startDate,
					endDate: endDate || dateRangeDates.endDate,
					metrics: [
						{
							name: 'totalUsers',
						},
					],
					dimensions: [ { name: 'audienceResourceName' } ],
					dimensionFilters: {
						audienceResourceName: ( audiences || [] ).map(
							( { name } ) => name
						),
					},
				};
			}
	),

	/**
	 * Gets the error for the audiences user count report.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
	 */
	getAudiencesUserCountReportError: createRegistrySelector(
		( select ) => () => {
			const {
				getAudiencesUserCountReportOptions,
				getConfigurableAudiences,
				getErrorForSelector,
			} = select( MODULES_ANALYTICS_4 );

			const configurableAudiences = getConfigurableAudiences();

			if ( configurableAudiences === undefined ) {
				return undefined;
			}

			const audiencesUserCountReportOptions =
				getAudiencesUserCountReportOptions( configurableAudiences );

			return getErrorForSelector( 'getReport', [
				audiencesUserCountReportOptions,
			] );
		}
	),
};

const store = Data.combineStores(
	fetchCreateAudienceStore,
	fetchSyncAvailableAudiencesStore,
	{
		initialState: {},
		actions: baseActions,
		controls: {},
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
