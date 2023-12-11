/**
 * `modules/analytics` data store: report.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS } from './constants';
import { stringifyObject } from '../../../util';
import { isRestrictedMetricsError } from '../util/error';
import { normalizeReportOptions } from '../util/report-normalization';
import {
	isValidDateRange,
	isValidOrders,
} from '../../../util/report-validation';
import {
	isValidDimensionFilters,
	isValidDimensions,
	isValidMetrics,
} from '../util/report-validation';
import { actions as adsenseActions } from './adsense';
import { isZeroReport } from '../util';
import { createGatheringDataStore } from '../../../googlesitekit/modules/create-gathering-data-store';

const { createRegistrySelector } = Data;

/**
 * Returns report args for a sample report.
 *
 * @since 1.107.0
 *
 * @param {Function} select The select function of the registry.
 * @return {Object} Report args.
 */
const getSampleReportArgs = ( select ) => {
	const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} );

	const args = {
		dimensions: [ 'ga:date' ],
		metrics: [ { expression: 'ga:users' } ],
		startDate,
		endDate,
	};

	const url = select( CORE_SITE ).getCurrentEntityURL();
	if ( url ) {
		args.url = url;
	}

	return args;
};

const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	controlCallback: ( { options } ) => {
		return API.get(
			'modules',
			'analytics',
			'report',
			normalizeReportOptions( options )
		);
	},
	reducerCallback: ( state, report, { options } ) => {
		return {
			...state,
			reports: {
				...state.reports,
				[ stringifyObject( options ) ]: report,
			},
		};
	},
	argsToParams: ( options ) => {
		return { options };
	},
	validateParams: ( { options } = {} ) => {
		invariant(
			isPlainObject( options ),
			'Options for Analytics report must be an object.'
		);
		invariant(
			isValidDateRange( options ),
			'Either date range or start/end dates must be provided for Analytics report.'
		);

		const { metrics, dimensions, dimensionFilters, orderby } =
			normalizeReportOptions( options );

		invariant(
			metrics.length,
			'Requests must specify at least one metric for an Analytics report.'
		);
		invariant(
			isValidMetrics( metrics ),
			'Metrics for an Analytics report must be either a string, an array of strings, an object, an array of objects or a mix of strings and objects. If an object is used, it must have "expression" and "alias" properties.'
		);

		if ( dimensions ) {
			invariant(
				isValidDimensions( dimensions ),
				'Dimensions for an Analytics report must be either a string, an array of strings, an object, an array of objects or a mix of strings and objects. If an object is used, it must have "name" property.'
			);
		}

		if ( dimensionFilters ) {
			invariant(
				isValidDimensionFilters( dimensionFilters ),
				'Dimension filters must be a map of dimension names as keys and dimension values as values.'
			);
		}

		if ( orderby ) {
			invariant(
				isValidOrders( orderby ),
				'Orders for an Analytics report must be either an object or an array of objects where each object should have "fieldName" and "sortOrder" properties.'
			);
		}
	},
} );

const gatheringDataStore = createGatheringDataStore( 'analytics', {
	storeName: MODULES_ANALYTICS,
	dataAvailable:
		global._googlesitekitModulesData?.[ 'data_available_analytics' ],
	selectDataAvailability: createRegistrySelector( ( select ) => () => {
		const args = getSampleReportArgs( select );

		// Disable reason: select needs to be called here or it will never run.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const report = select( MODULES_ANALYTICS ).getReport( args );
		const hasResolvedReport = select(
			MODULES_ANALYTICS
		).hasFinishedResolution( 'getReport', [ args ] );

		if ( ! hasResolvedReport ) {
			return undefined;
		}

		const hasReportError = select( MODULES_ANALYTICS ).getErrorForSelector(
			'getReport',
			[ args ]
		);

		// If there is an error, return `null` since we don't know if there is data or not.
		if ( hasReportError ) {
			return null;
		}

		if (
			! Array.isArray( report[ 0 ]?.data?.rows ) ||
			report[ 0 ]?.data?.rows?.length === 0
		) {
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
		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry
			.select( MODULES_ANALYTICS )
			.getReport( options );

		// If there is already a report loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingReport ) {
			return;
		}

		const { error } = yield fetchGetReportStore.actions.fetchGetReport(
			options
		);

		// If the report was requested with AdSense metrics, set `adsenseLinked` accordingly.
		if (
			normalizeReportOptions( options ).metrics.some(
				( { expression } ) => /^ga:adsense/.test( expression )
			)
		) {
			if ( isRestrictedMetricsError( error, 'ga:adsense' ) ) {
				// If the error is a restricted metrics error for AdSense metrics, the services are not linked.
				yield adsenseActions.setAdsenseLinked( false );
			} else {
				// If there is no restricted metrics error OR the restricted metrics error
				// does not cite any AdSense metrics, then the services are linked.
				yield adsenseActions.setAdsenseLinked( true );
			}
		}
	},
};

const baseSelectors = {
	/**
	 * Gets an Analytics report for the given options.
	 *
	 * @since 1.13.0
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
	 * @param {Array.<Object>} [options.orderby]          Optional. An order definition object, or a list of order definition objects, each one containing 'fieldName' and 'sortOrder'. 'sortOrder' must be either 'ASCENDING' or 'DESCENDING'. Default empty array.
	 * @param {string}         [options.url]              Optional. URL to get a report for only this URL. Default an empty string.
	 * @param {number}         [options.limit]            Optional. Maximum number of entries to return. Default 1000.
	 * @return {(Array.<Object>|undefined)} An Analytics report; `undefined` if not loaded.
	 */
	getReport( state, options ) {
		const { reports } = state;

		return reports[ stringifyObject( options ) ];
	},

	/**
	 * Gets a Page title to URL map for the given options.
	 *
	 * @since 1.42.0
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
				if ( ! Array.isArray( report ) ) {
					return;
				}

				const pagePaths = [];
				const REQUEST_MULTIPLIER = 5;

				/*
				 * Iterate over the report, finding which dimension contains the
				 * ga:pagePath metric which we add to the array of pagePaths.
				 */
				( report || [] ).forEach( ( { columnHeader, data } ) => {
					if (
						Array.isArray( columnHeader?.dimensions ) &&
						Array.isArray( data?.rows ) &&
						columnHeader.dimensions.includes( 'ga:pagePath' )
					) {
						const pagePathIndex =
							columnHeader.dimensions.indexOf( 'ga:pagePath' );
						( data?.rows || [] ).forEach( ( { dimensions } ) => {
							if (
								! pagePaths.includes(
									dimensions[ pagePathIndex ]
								)
							) {
								pagePaths.push( dimensions[ pagePathIndex ] );
							}
						} );
					}
				} );

				const urlTitleMap = {};
				if ( ! pagePaths.length ) {
					return urlTitleMap;
				}

				const options = {
					startDate,
					endDate,
					dimensions: [ 'ga:pagePath', 'ga:pageTitle' ],
					dimensionFilters: { 'ga:pagePath': pagePaths.sort() },
					metrics: [
						{ expression: 'ga:pageviews', alias: 'Pageviews' },
					],
					orderby: [
						{ fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' },
					],
					limit: REQUEST_MULTIPLIER * pagePaths.length,
				};

				const pageTitlesReport =
					select( MODULES_ANALYTICS ).getReport( options );
				if ( undefined === pageTitlesReport ) {
					return;
				}

				( pageTitlesReport?.[ 0 ]?.data?.rows || [] ).forEach(
					( { dimensions } ) => {
						if ( ! urlTitleMap[ dimensions[ 0 ] ] ) {
							// key is the url, value is the page title.
							urlTitleMap[ dimensions[ 0 ] ] = dimensions[ 1 ];
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
	 * Determines whether Analytics has zero data or not.
	 *
	 * @since 1.69.0
	 *
	 * @return {boolean|undefined} Returns FALSE if not gathering data and the report is not zero, otherwise TRUE. If the request is still being resolved, returns undefined.
	 */
	hasZeroData: createRegistrySelector( ( select ) => () => {
		const isGatheringData = select( MODULES_ANALYTICS ).isGatheringData();
		if ( isGatheringData === undefined ) {
			return undefined;
		}
		if ( isGatheringData === true ) {
			return true;
		}

		const args = getSampleReportArgs( select );

		// Disable reason: select needs to be called here or it will never run.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const report = select( MODULES_ANALYTICS ).getReport( args );
		const hasResolvedReport = select(
			MODULES_ANALYTICS
		).hasFinishedResolution( 'getReport', [ args ] );

		if ( ! hasResolvedReport ) {
			return undefined;
		}

		if ( ! Array.isArray( report ) ) {
			return false;
		}

		return isZeroReport( report );
	} ),
};

const store = Data.combineStores( fetchGetReportStore, gatheringDataStore, {
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
