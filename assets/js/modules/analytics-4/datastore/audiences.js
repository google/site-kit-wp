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
import {
	MODULES_ANALYTICS_4,
	CUSTOM_DIMENSION_DEFINITIONS,
	DATE_RANGE_OFFSET,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from './constants';
import {
	combineStores,
	createRegistrySelector,
	commonActions,
} from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { getPreviousDate } from '../../../util';
import { validateAudience } from '../utils/validation';
import { RESOURCE_TYPE_AUDIENCE } from './partial-data';

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
	const { select, resolveSelect } = registry;

	const reportOptions = select(
		MODULES_ANALYTICS_4
	).getAudiencesUserCountReportOptions( audiences, { startDate, endDate } );

	const report = await resolveSelect( MODULES_ANALYTICS_4 ).getReport(
		reportOptions
	);

	const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
		'getReport',
		[ reportOptions ]
	);

	if ( error ) {
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
		const { response: availableAudiences, error } =
			yield fetchSyncAvailableAudiencesStore.actions.fetchSyncAvailableAudiences();

		if ( error ) {
			return { response: availableAudiences, error };
		}

		const registry = yield commonActions.getRegistry();
		const { select, dispatch } = registry;

		// Remove any configuredAudiences that are no longer available in availableAudiences.
		const configuredAudiences =
			select( CORE_USER ).getConfiguredAudiences();
		const newConfiguredAudiences = configuredAudiences?.filter(
			( configuredAudience ) =>
				availableAudiences?.some(
					( { name } ) => name === configuredAudience
				)
		);

		if (
			configuredAudiences &&
			newConfiguredAudiences &&
			newConfiguredAudiences !== configuredAudiences
		) {
			dispatch( CORE_USER ).setConfiguredAudiences(
				newConfiguredAudiences || []
			);
		}

		return { response: availableAudiences, error };
	},

	/**
	 * Syncs available audiences older than 1 hour.
	 *
	 * @since 1.132.0
	 *
	 * @return {void}
	 */
	*maybeSyncAvailableAudiences() {
		const registry = yield commonActions.getRegistry();
		const { select, dispatch } = registry;

		const availableAudiencesLastSyncedAt =
			select( MODULES_ANALYTICS_4 ).getAvailableAudiencesLastSyncedAt();

		// Update the audience cache if the availableAudiencesLastSyncedAt setting is older than 1 hour.
		if (
			! availableAudiencesLastSyncedAt ||
			availableAudiencesLastSyncedAt * 1000 <
				// eslint-disable-next-line sitekit/no-direct-date
				Date.now() - 1 * 60 * 60 * 1000
		) {
			yield commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences()
			);
		}
	},

	/**
	 * Retrives the initial set of audiences for selection.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array} availableAudiences List of available audiences.
	 * @return {Array} List of initial audiences.
	 */
	*retrieveInitialAudienceSelection( availableAudiences ) {
		const registry = yield commonActions.getRegistry();

		const { select } = registry;

		const configuredAudiences = [];

		const userAudiences = availableAudiences.filter(
			( { audienceType } ) => audienceType === 'USER_AUDIENCE'
		);

		if ( userAudiences.length > 0 ) {
			// If there are user audiences, filter and sort them by total users over the last 90 days,
			// and add the top two (MAX_INITIAL_AUDIENCES) which have users to the configured audiences.

			const endDate = select( CORE_USER ).getReferenceDate();

			const startDate = getPreviousDate(
				endDate,
				90 + DATE_RANGE_OFFSET // Add offset to ensure we have data for the entirety of the last 90 days.
			);

			const { audienceResourceNames, error } = yield commonActions.await(
				getNonZeroDataAudiencesSortedByTotalUsers(
					registry,
					userAudiences,
					startDate,
					endDate
				)
			);

			if ( error ) {
				return { error };
			}

			configuredAudiences.push(
				...audienceResourceNames.slice( 0, MAX_INITIAL_AUDIENCES )
			);
		}

		if ( configuredAudiences.length < MAX_INITIAL_AUDIENCES ) {
			// If there are less than two (MAX_INITIAL_AUDIENCES) configured user audiences, add the Site Kit-created audiences
			// if they exist, up to the limit of two.

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

		return configuredAudiences;
	},

	/**
	 * Populates the configured audiences with the top two user audiences and/or the Site Kit-created audiences,
	 * depending on their availability and suitability (data over the last 90 days is required for user audiences).
	 *
	 * If no suitable audiences are available, creates the "new-visitors" and "returning-visitors" audiences.
	 * If the `googlesitekit_post_type` custom dimension doesn't exist, creates it.
	 *
	 * @since 1.128.0
	 * @since 1.131.0 Added `failedSiteKitAudienceSlugs` parameter to retry failed Site Kit audience creation.
	 *
	 * @param {Array} failedSiteKitAudienceSlugs List of failed Site Kit audience slugs to retry.
	 * @return {Object} Object with `failedSiteKitAudienceSlugs`, `createdSiteKitAudienceSlugs` and `error`.
	 */
	*enableAudienceGroup( failedSiteKitAudienceSlugs ) {
		const registry = yield commonActions.getRegistry();

		const { dispatch, select, resolveSelect } = registry;

		const { response: availableAudiences, error: syncError } =
			yield commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences()
			);

		if ( syncError ) {
			return { error: syncError };
		}

		let configuredAudiences = [];

		if ( ! failedSiteKitAudienceSlugs?.length ) {
			configuredAudiences = yield commonActions.await(
				dispatch(
					MODULES_ANALYTICS_4
				).retrieveInitialAudienceSelection( availableAudiences )
			);
		}

		if ( configuredAudiences.length === 0 ) {
			const requiredAudienceSlugs = [
				'new-visitors',
				'returning-visitors',
			];
			const audiencesToCreate = failedSiteKitAudienceSlugs?.length
				? failedSiteKitAudienceSlugs
				: requiredAudienceSlugs;

			// If there are no configured audiences by this point, create the "new-visitors" and "returning-visitors" audiences,
			// and add them to the configured audiences.
			const audienceCreationResults = yield commonActions.await(
				Promise.all(
					audiencesToCreate.map( ( audienceSlug ) => {
						return dispatch( MODULES_ANALYTICS_4 ).createAudience(
							SITE_KIT_AUDIENCE_DEFINITIONS[ audienceSlug ]
						);
					} )
				)
			);

			const failedAudiencesToRetry = [];

			audienceCreationResults.forEach( ( result, index ) => {
				const audienceSlug = audiencesToCreate[ index ];
				if ( result.error ) {
					failedAudiencesToRetry.push( audienceSlug );
				} else {
					configuredAudiences.push( result.response.name );
				}
			} );

			yield commonActions.await(
				resolveSelect( CORE_USER ).getAudienceSettings()
			);

			if ( failedAudiencesToRetry.length > 0 ) {
				return {
					failedSiteKitAudienceSlugs: failedAudiencesToRetry,
				};
			}

			const existingConfiguredAudiences =
				select( CORE_USER ).getConfiguredAudiences() || [];

			configuredAudiences.push( ...existingConfiguredAudiences );

			// Resync available audiences to ensure the newly created audiences are available.
			const { response: newAvailableAudiences } =
				yield commonActions.await(
					dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences()
				);

			// Find the audience in the newly available audiences that matches the required slug.
			// If a matching audience is found and it's not already in the configured audiences, add it.
			// This is to ensure if one audience was created successfully but the other failed,
			// the successful one is still added on the retry.
			requiredAudienceSlugs.forEach( ( slug ) => {
				const matchingAudience = newAvailableAudiences.find(
					( item ) => item.audienceSlug === slug
				);
				if (
					matchingAudience &&
					! configuredAudiences.includes( matchingAudience.name )
				) {
					configuredAudiences.push( matchingAudience.name );
				}
			} );
		}

		// Create custom dimension if it doesn't exist.
		yield commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions()
		);

		if (
			! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				'googlesitekit_post_type'
			)
		) {
			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			const { error } = yield commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).fetchCreateCustomDimension(
					propertyID,
					CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type
				)
			);

			if ( error ) {
				return { error };
			}

			// If the custom dimension was created successfully, mark it as gathering
			// data immediately so that it doesn't cause unnecessary report requests.
			dispatch(
				MODULES_ANALYTICS_4
			).receiveIsCustomDimensionGatheringData(
				'googlesitekit_post_type',
				true
			);

			// Resync available custom dimensions to ensure the newly created custom dimension is available.
			yield commonActions.await(
				dispatch(
					MODULES_ANALYTICS_4
				).fetchSyncAvailableCustomDimensions()
			);
		}

		dispatch( CORE_USER ).setConfiguredAudiences( configuredAudiences );

		const { error } = yield commonActions.await(
			dispatch( CORE_USER ).saveAudienceSettings()
		);

		if ( error ) {
			return { error };
		}
	},

	/**
	 * Populates the configured audiences for the secondary user.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `error`.
	 */
	*enableSecondaryUserAudienceGroup() {
		const registry = yield commonActions.getRegistry();

		const { dispatch, resolveSelect } = registry;

		const { response: availableAudiences, error: syncError } =
			yield commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences()
			);

		if ( syncError ) {
			return { error: syncError };
		}

		const configuredAudiences = yield commonActions.await(
			dispatch( MODULES_ANALYTICS_4 ).retrieveInitialAudienceSelection(
				availableAudiences
			)
		);

		if ( configuredAudiences.length < MAX_INITIAL_AUDIENCES ) {
			// Add 'Purchasers' audience if it has data.
			const purchasersAudience = availableAudiences.find(
				( { audienceSlug } ) => audienceSlug === 'purchasers'
			);

			if ( purchasersAudience ) {
				const purchasersResourceDataAvailabilityDate =
					yield commonActions.await(
						resolveSelect(
							MODULES_ANALYTICS_4
						).getResourceDataAvailabilityDate(
							purchasersAudience.name,
							RESOURCE_TYPE_AUDIENCE
						)
					);

				if ( purchasersResourceDataAvailabilityDate ) {
					configuredAudiences.push( purchasersAudience.name );
				}
			}
		}

		dispatch( CORE_USER ).setConfiguredAudiences( configuredAudiences );

		const { error } = yield commonActions.await(
			dispatch( CORE_USER ).saveAudienceSettings()
		);

		if ( error ) {
			return { error };
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
		const registry = yield commonActions.getRegistry();

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
	 * @since 1.131.0
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
	 * @since 1.131.0
	 *
	 * @return {(Object|undefined)} Error object if exists, otherwise undefined.
	 */
	getAudienceUserCountReportErrors: createRegistrySelector(
		( select ) => () => {
			const {
				getConfigurableAudiences,
				getAudiencesUserCountReportOptions,
				getSiteKitAudiencesUserCountReportOptions,
				getErrorForSelector,
				getConfiguredSiteKitAndOtherAudiences,
				hasAudiencePartialData,
			} = select( MODULES_ANALYTICS_4 );

			const configurableAudiences = getConfigurableAudiences();

			if ( configurableAudiences === undefined ) {
				return undefined;
			}

			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const [ siteKitAudiences, otherAudiences ] =
				getConfiguredSiteKitAndOtherAudiences();

			const isSiteKitAudiencePartialData =
				hasAudiencePartialData( siteKitAudiences );

			if ( undefined === isSiteKitAudiencePartialData ) {
				return undefined;
			}

			const siteKitUserCountReportError = isSiteKitAudiencePartialData
				? getErrorForSelector( 'getReport', [
						getSiteKitAudiencesUserCountReportOptions(),
				  ] )
				: undefined;

			const otherUserCountReportError =
				isSiteKitAudiencePartialData === false ||
				otherAudiences?.length > 0
					? getErrorForSelector( 'getReport', [
							getAudiencesUserCountReportOptions(
								isSiteKitAudiencePartialData
									? otherAudiences
									: configurableAudiences
							),
					  ] )
					: undefined;

			return [ siteKitUserCountReportError, otherUserCountReportError ];
		}
	),

	/**
	 * Gets the report options for the Site Kit audiences user count report.
	 *
	 * @since 1.134.0
	 *
	 * @return {Object} Returns the report options for the Site Kit audiences user count report.
	 */
	getSiteKitAudiencesUserCountReportOptions: createRegistrySelector(
		( select ) => () => {
			const dateRangeDates = select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

			return {
				startDate: dateRangeDates.startDate,
				endDate: dateRangeDates.endDate,
				metrics: [
					{
						name: 'totalUsers',
					},
				],
				dimensions: [ { name: 'newVsReturning' } ],
			};
		}
	),

	/**
	 * Checks if any of the provided audiences are in the partial data state.
	 *
	 * @since 1.134.0
	 *
	 * @param {Array} audiences Array of audiences to check.
	 * @return {boolean|undefined} True if any of the provided audiences is in partial data state, otherwise false. Undefined if available audiences are undefined.
	 */
	hasAudiencePartialData: createRegistrySelector(
		( select ) => ( state, audiences ) => {
			if ( undefined === audiences ) {
				return undefined;
			}

			return ( audiences || [] ).some( ( { name } ) => {
				return select( MODULES_ANALYTICS_4 ).isAudiencePartialData(
					name
				);
			} );
		}
	),

	/**
	 * Gets the configured Site Kit and other (non Site Kit) audiences.
	 *
	 * @since 1.134.0
	 *
	 * @return {Array} Array of Site Kit and other audiences.
	 */
	getConfiguredSiteKitAndOtherAudiences: createRegistrySelector(
		( select ) => () => {
			const audiences =
				select( MODULES_ANALYTICS_4 ).getConfigurableAudiences();

			if ( undefined === audiences ) {
				return undefined;
			}

			if ( ! audiences?.length ) {
				return [];
			}

			const [ siteKitAudiences, otherAudiences ] = audiences.reduce(
				( [ siteKit, other ], audience ) => {
					if ( audience.audienceType === 'SITE_KIT_AUDIENCE' ) {
						siteKit.push( audience );
					} else {
						other.push( audience );
					}
					return [ siteKit, other ];
				},
				[ [], [] ] // Initial values.
			);

			return [ siteKitAudiences, otherAudiences ];
		}
	),
};

const store = combineStores(
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
