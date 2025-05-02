/**
 * `modules/analytics-4` data store: report.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createGatheringDataStore } from '../../../googlesitekit/modules/create-gathering-data-store';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4, DATE_RANGE_OFFSET } from './constants';
import { DAY_IN_SECONDS, dateSub, stringifyObject } from '../../../util';
import { normalizeReportOptions, isZeroReport } from '../utils';
import { validateReport } from '../utils/validation';
import {
	createLogger,
	getColour,
} from '../components/audience-segmentation/dashboard/AudienceTilesWidget/logger';

const logIt = createLogger( 'GA4 report', {
	logOnlyOnce: true,
	logDiff: true,
} );

const log = ( msg, reportOptions ) => {
	const { reportID, ...rest } = reportOptions;

	if ( ! reportID ) {
		return;
	}

	const colour = getColour( reportID );

	logIt( `${ msg } \x1b[${ colour }m${ reportID }\x1b[0m`, rest );
};
const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	controlCallback: ( { options } ) => {
		log( 'controlCallback', options );
		// eslint-disable-next-line no-unused-vars
		const { reportID, ...rest } = options;
		return get(
			'modules',
			'analytics-4',
			'report',
			normalizeReportOptions( rest )
		);
	},
	reducerCallback: ( state, report, { options } ) => {
		// eslint-disable-next-line no-unused-vars
		const { reportID, ...rest } = options;
		return {
			...state,
			reports: {
				...state.reports,
				[ stringifyObject( rest ) ]: report,
			},
		};
	},
	argsToParams: ( options ) => {
		// eslint-disable-next-line no-unused-vars
		const { reportID, ...rest } = options;
		return { options: rest };
	},
	validateParams: ( { options } = {} ) => {
		// eslint-disable-next-line no-unused-vars
		const { reportID, ...rest } = options;
		return validateReport( rest );
	},
} );

const gatheringDataStore = createGatheringDataStore( 'analytics-4', {
	storeName: MODULES_ANALYTICS_4,
	dataAvailable:
		global._googlesitekitModulesData?.[ 'data_available_analytics-4' ],
	selectDataAvailability: createRegistrySelector( ( select ) => () => {
		// Disable reason: This needs to be run here in order for the report to be resolved.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const hasZeroData = select( MODULES_ANALYTICS_4 ).hasZeroData();

		const args = select( MODULES_ANALYTICS_4 ).getSampleReportArgs();

		const hasResolvedReport = select(
			MODULES_ANALYTICS_4
		).hasFinishedResolution( 'getReport', [ args ] );

		if ( ! hasResolvedReport || hasZeroData === undefined ) {
			return undefined;
		}

		const hasReportError = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ args ] );

		// If there is an error, return `null` since we don't know if there is data or not.
		if ( hasReportError ) {
			return null;
		}

		if ( hasZeroData === false ) {
			return true;
		}

		const isAuthenticated = select( CORE_USER ).isAuthenticated();

		if ( isAuthenticated === undefined ) {
			return undefined;
		}
		if ( ! isAuthenticated ) {
			return false;
		}

		const propertyCreateTime =
			select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();

		if ( undefined === propertyCreateTime ) {
			return undefined;
		}

		// If the property is new and has no data, assume it's still gathering data.
		if ( propertyCreateTime === 0 ) {
			return false;
		}

		// If the property was created within the last three days and has no data, assume it's still gathering data.
		const now = select( CORE_USER ).getReferenceDate();
		const threeDaysAgo = dateSub( now, 3 * DAY_IN_SECONDS );
		if ( propertyCreateTime > threeDaysAgo.getTime() ) {
			return false;
		}

		return true;
	} ),
} );

const baseInitialState = {
	reports: {},
};

const baseResolvers = {
	*getReport( options = {} ) {
		log( '*getReport', options );
		const registry = yield commonActions.getRegistry();
		const existingReport = registry
			.select( MODULES_ANALYTICS_4 )
			.getReport( options );

		// If there is already a report loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingReport ) {
			log( '*getReport: already loaded', options );
			return;
		}

		log( '*getReport: fetching', options );
		const result = yield fetchGetReportStore.actions.fetchGetReport(
			options
		);
		log( '*getReport: got result', options );
		return result;
	},
};

const baseSelectors = {
	/**
	 * Gets an Analytics report for the given options.
	 *
	 * @since 1.94.0
	 * @since 1.111.0 Add metricFilters to the options list, to reflect added support for the metric filters.
	 *
	 * @param {Object}         state                      Data store's state.
	 * @param {Object}         options                    Options for generating the report.
	 * @param {string}         options.startDate          Required. Start date to query report data for as YYYY-mm-dd.
	 * @param {string}         options.endDate            Required. End date to query report data for as YYYY-mm-dd.
	 * @param {Array.<string>} options.metrics            Required. List of metrics to query.
	 * @param {string}         [options.compareStartDate] Optional. Start date to compare report data for as YYYY-mm-dd.
	 * @param {string}         [options.compareEndDate]   Optional. End date to compare report data for as YYYY-mm-dd.
	 * @param {Array.<string>} [options.dimensions]       Optional. List of dimensions to group results by. Default an empty array.
	 * @param {Object}         [options.dimensionFilters] Optional. Map of dimension filters for filtering options on a dimension. Default an empty object.
	 * @param {Object}         [options.metricFilters]    Optional. Map of metric filters for filtering options on a metric. Default an empty object.
	 * @param {Array.<Object>} [options.orderby]          Optional. An order definition object, or a list of order definition objects, each one containing 'fieldName' and 'sortOrder'. 'sortOrder' must be either 'ASCENDING' or 'DESCENDING'. Default empty array.
	 * @param {string}         [options.url]              Optional. URL to get a report for only this URL. Default an empty string.
	 * @param {number}         [options.limit]            Optional. Maximum number of entries to return. Default 1000.
	 * @return {(Array.<Object>|undefined)} An Analytics report; `undefined` if not loaded.
	 */
	getReport( state, options ) {
		const { reports } = state;

		log( 'getReport', options );

		// eslint-disable-next-line no-unused-vars
		const { reportID, ...rest } = options;

		return reports[ stringifyObject( rest ) ];
	},

	/**
	 * Gets a Page title to URL map for the given options.
	 *
	 * @since 1.96.0
	 *
	 * @param {Object} state             Data store's state.
	 * @param {Object} report            A report from the getReport selector containing pagePaths.
	 * @param {Object} options           Options for generating the report.
	 * @param {string} options.startDate Required, start date to query report data for as YYYY-mm-dd.
	 * @param {string} options.endDate   Required, end date to query report data for as YYYY-mm-dd.
	 * @return {(Object|undefined)} A map with url as the key and page title as the value. `undefined` if not loaded.
	 */
	getPageTitles: createRegistrySelector(
		( select ) =>
			( state, report, { startDate, endDate } = {} ) => {
				if ( ! isPlainObject( report ) ) {
					return;
				}

				const pagePaths = [];
				const REQUEST_MULTIPLIER = 5;

				/*
				 * Iterate over the report rows, finding the dimension containing the
				 * pagePath value which we add to the array of pagePaths.
				 */
				const { dimensionHeaders, rows } = report;
				if (
					Array.isArray( dimensionHeaders ) &&
					Array.isArray( rows )
				) {
					const pagePathIndex = dimensionHeaders.findIndex(
						( { name } ) => name === 'pagePath'
					);
					rows.forEach( ( { dimensionValues } ) => {
						if (
							! pagePaths.includes(
								dimensionValues[ pagePathIndex ].value
							)
						) {
							pagePaths.push(
								dimensionValues[ pagePathIndex ].value
							);
						}
					} );
				}

				const urlTitleMap = {};
				if ( ! pagePaths.length ) {
					return urlTitleMap;
				}

				const options = {
					startDate,
					endDate,
					dimensions: [ 'pagePath', 'pageTitle' ],
					dimensionFilters: { pagePath: pagePaths.sort() },
					metrics: [ { name: 'screenPageViews' } ],
					orderby: [
						{
							metric: { metricName: 'screenPageViews' },
							desc: true,
						},
					],
					limit: REQUEST_MULTIPLIER * pagePaths.length,
				};

				const pageTitlesReport =
					select( MODULES_ANALYTICS_4 ).getReport( options );
				if ( undefined === pageTitlesReport ) {
					return;
				}

				( pageTitlesReport?.rows || [] ).forEach(
					( { dimensionValues } ) => {
						if ( ! urlTitleMap[ dimensionValues[ 0 ].value ] ) {
							// key is the url, value is the page title.
							urlTitleMap[ dimensionValues[ 0 ].value ] =
								dimensionValues[ 1 ].value;
						}
					}
				);

				pagePaths.forEach( ( pagePath ) => {
					if ( ! urlTitleMap[ pagePath ] ) {
						// If we don't have a title for the pagePath, we use '(unknown)'.
						urlTitleMap[ pagePath ] = __(
							'(unknown)',
							'google-site-kit'
						);
					}
				} );

				return urlTitleMap;
			}
	),

	/**
	 * Determines whether Analytics 4 has zero data or not.
	 *
	 * @since 1.95.0
	 * @since 1.107.0 Returns `true` if the report request has an error to be consistent with `hasZeroData` selectors of other modules.
	 * @since 1.128.0 Add optional `reportArgs` parameter to allow checking zero data for a specific report.
	 *
	 * @param {Object}           state      Data store's state.
	 * @param {Object|undefined} reportArgs Optional. Options for generating the report.
	 * @return {boolean|undefined} Returns `true` if the report is zero, otherwise `false`. Returns `undefined` while resolving.
	 */
	hasZeroData: createRegistrySelector(
		( select ) => ( state, reportArgs ) => {
			const args =
				reportArgs ||
				select( MODULES_ANALYTICS_4 ).getSampleReportArgs();

			// Disable reason: select needs to be called here or it will never run.
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const report = select( MODULES_ANALYTICS_4 ).getReport( args );
			const hasResolvedReport = select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getReport', [ args ] );

			if ( ! hasResolvedReport ) {
				return undefined;
			}

			const hasReportError = select(
				MODULES_ANALYTICS_4
			).getErrorForSelector( 'getReport', [ args ] );

			// If there is an error, we assume it's a zero report.
			if ( hasReportError ) {
				return true;
			}

			return isZeroReport( report );
		}
	),

	/**
	 * Returns report args for a sample report.
	 *
	 * @since 1.107.0
	 * @since 1.124.0 Moved from the main analytics-4 datastore file to utils.
	 * @since 1.136.0 Moved back to the main analytics-4 datastore file and updated to be a selector.
	 *
	 * @param {Function} select The select function of the registry.
	 * @return {Object} Report args.
	 */
	getSampleReportArgs: createRegistrySelector( ( select ) => () => {
		const { compareStartDate: startDate, endDate } = select(
			CORE_USER
		).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const args = {
			dimensions: [ 'date' ],
			metrics: [ { name: 'totalUsers' } ],
			startDate,
			endDate,
		};

		const url = select( CORE_SITE ).getCurrentEntityURL();
		if ( url ) {
			args.url = url;
		}

		return args;
	} ),

	/**
	 * Gets a given report for each of the provided audiences.
	 *
	 * TODO: This will be refactored to use pivot reports in #8484.
	 *
	 * @since 1.126.0
	 *
	 * @param {Object}   state                 Data store's state.
	 * @param {Object}   options               Options for generating the report.
	 * @param {string[]} audienceResourceNames Audience resource names to get the report for.
	 * @return {Array.<Object>} An array of report response objects for each provided audience resource name.
	 */
	getReportForAllAudiences: createRegistrySelector(
		( select ) => ( state, options, audienceResourceNames ) => {
			return audienceResourceNames?.map( ( audienceResourceName ) => {
				const partialDataSiteKitAudience =
					select( MODULES_ANALYTICS_4 ).getPartialDataSiteKitAudience(
						audienceResourceName
					);

				if ( partialDataSiteKitAudience === undefined ) {
					return undefined;
				}

				const dimensionFilters = {};

				if ( partialDataSiteKitAudience ) {
					dimensionFilters.newVsReturning =
						partialDataSiteKitAudience.audienceSlug ===
						'new-visitors'
							? 'new'
							: 'returning';
				} else {
					dimensionFilters.audienceResourceName =
						audienceResourceName;
				}

				return select( MODULES_ANALYTICS_4 ).getReport( {
					...options,
					dimensionFilters: {
						...options.dimensionFilters,
						...dimensionFilters,
					},
				} );
			} );
		}
	),
};

const store = combineStores( fetchGetReportStore, gatheringDataStore, {
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
