/**
 * Analytics useAudienceTilesReports custom hook.
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
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS_4 } from '../datastore/constants';

/**
 * Checks if the audience reports are loaded for the given report options.
 *
 * @since 1.136.0
 *
 * @param {Object} reportOptions       Report options.
 * @param {Array}  configuredAudiences Configured audiences.
 * @return {boolean} Whether the report is loaded.
 */
function useReportLoaded( reportOptions, configuredAudiences ) {
	return useSelect( ( select ) =>
		configuredAudiences.every( ( audienceResourceName ) => {
			const partialDataSiteKitAudience =
				select( MODULES_ANALYTICS_4 ).getPartialDataSiteKitAudience(
					audienceResourceName
				);

			if ( partialDataSiteKitAudience === undefined ) {
				return false;
			}

			const dimensionFilters = {};

			if ( partialDataSiteKitAudience ) {
				dimensionFilters.newVsReturning =
					partialDataSiteKitAudience.audienceSlug === 'new-visitors'
						? 'new'
						: 'returning';
			} else {
				dimensionFilters.audienceResourceName = audienceResourceName;
			}

			return select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[
					{
						...reportOptions,
						dimensionFilters: {
							...reportOptions.dimensionFilters,
							...dimensionFilters,
						},
					},
				]
			);
		} )
	);
}

/**
 * Checks if there are errors for the audience reports with the given report options.
 *
 * @since 1.136.0
 *
 * @param {Object} reportOptions       Report options.
 * @param {Array}  configuredAudiences Configured audiences.
 * @return {Object} Object with the errors for each audience.
 */
function useReportErrors( reportOptions, configuredAudiences ) {
	return useSelect( ( select ) => {
		return configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			const partialDataSiteKitAudience =
				select( MODULES_ANALYTICS_4 ).getPartialDataSiteKitAudience(
					audienceResourceName
				);

			if ( partialDataSiteKitAudience === undefined ) {
				return acc;
			}

			const dimensionFilters = {};

			if ( partialDataSiteKitAudience ) {
				dimensionFilters.newVsReturning =
					partialDataSiteKitAudience.audienceSlug === 'new-visitors'
						? 'new'
						: 'returning';
			} else {
				dimensionFilters.audienceResourceName = audienceResourceName;
			}

			const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[
					{
						...reportOptions,
						dimensionFilters: {
							...reportOptions.dimensionFilters,
							...dimensionFilters,
						},
					},
				]
			);

			if ( error ) {
				acc[ audienceResourceName ] = error;
			}

			return acc;
		}, {} );
	} );
}

/**
 * Fetch reports for audience tiles.
 *
 * @since 1.136.0
 *
 * @param {Object}  args                              Arguments for the hook.
 * @param {boolean} args.isSiteKitAudiencePartialData Whether the Site Kit audiences are partially loaded.
 * @param {Array}   args.siteKitAudiences             Site Kit audiences.
 * @param {Array}   args.otherAudiences               Other audiences.
 * @return {Object} Object with the report data.
 */
export default function useAudienceTilesReports( {
	isSiteKitAudiencePartialData,
	siteKitAudiences,
	otherAudiences,
} ) {
	// An array of audience resource names.
	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);

	const audiencesDimensionFilter = {
		audienceResourceName: configuredAudiences,
	};

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const { startDate, endDate } = dates;

	const shouldFetchReport =
		isSiteKitAudiencePartialData === undefined
			? undefined
			: otherAudiences.length > 0 ||
			  isSiteKitAudiencePartialData === false;
	const shouldFetchSiteKitAudiencesReport =
		siteKitAudiences.length > 0 ? isSiteKitAudiencePartialData : false;

	const reportOptions = {
		...dates,
		dimensions: [ { name: 'audienceResourceName' } ],
		dimensionFilters: audiencesDimensionFilter,
		metrics: [
			{ name: 'totalUsers' },
			{ name: 'sessionsPerUser' },
			{ name: 'screenPageViewsPerSession' },
			{ name: 'screenPageViews' },
		],
	};
	const report = useInViewSelect(
		( select ) => {
			if ( shouldFetchReport === undefined ) {
				return undefined;
			}
			if ( ! shouldFetchReport ) {
				return null;
			}

			return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
		},
		[ shouldFetchReport, reportOptions ]
	);

	const reportLoaded = useSelect( ( select ) => {
		if ( shouldFetchReport === undefined ) {
			return undefined;
		}
		if ( ! shouldFetchReport ) {
			// If we don't need to fetch the report, we can consider it loaded to simplify the loading state logic.
			return true;
		}
		return select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getReport',
			[ reportOptions ]
		);
	} );
	const reportError = useSelect( ( select ) => {
		if ( shouldFetchReport === undefined ) {
			return undefined;
		}
		if ( ! shouldFetchReport ) {
			return null;
		}
		return select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportOptions,
		] );
	} );
	const newVsReturningReportOptions = {
		...dates,
		dimensions: [ { name: 'newVsReturning' } ],
		dimensionFilters: { newVsReturning: [ 'new', 'returning' ] },
		metrics: [
			{ name: 'totalUsers' },
			{ name: 'sessionsPerUser' },
			{ name: 'screenPageViewsPerSession' },
			{ name: 'screenPageViews' },
		],
	};
	const siteKitAudiencesReport = useInViewSelect(
		( select ) => {
			if ( shouldFetchSiteKitAudiencesReport === undefined ) {
				return undefined;
			}
			if ( ! shouldFetchSiteKitAudiencesReport ) {
				return null;
			}
			return select( MODULES_ANALYTICS_4 ).getReport(
				newVsReturningReportOptions
			);
		},
		[ shouldFetchSiteKitAudiencesReport, newVsReturningReportOptions ]
	);
	const siteKitAudiencesReportLoaded = useSelect( ( select ) => {
		if ( shouldFetchSiteKitAudiencesReport === undefined ) {
			return undefined;
		}
		if ( ! shouldFetchSiteKitAudiencesReport ) {
			// If we don't need to fetch the report, we can consider it loaded to simplify the loading state logic.
			return true;
		}
		return select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getReport',
			[ newVsReturningReportOptions ]
		);
	} );
	const siteKitAudiencesReportError = useSelect( ( select ) => {
		if ( shouldFetchSiteKitAudiencesReport === undefined ) {
			return undefined;
		}
		if ( ! shouldFetchSiteKitAudiencesReport ) {
			return null;
		}
		return select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			newVsReturningReportOptions,
		] );
	} );

	const totalPageviewsReportOptions = {
		startDate,
		endDate,
		metrics: [ { name: 'screenPageViews' } ],
	};
	const totalPageviewsReport = useInViewSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReport(
			totalPageviewsReportOptions
		);
	} );
	const totalPageviewsReportLoaded = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
			totalPageviewsReportOptions,
		] )
	);
	const totalPageviewsReportError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			totalPageviewsReportOptions,
		] )
	);

	const totalPageviews =
		Number(
			totalPageviewsReport?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value
		) || 0;

	const topCitiesReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'city' ],
		metrics: [ { name: 'totalUsers' } ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 4, // Limit is set to 4 so that (not set) can be filtered out and 3 cities remain to display.
	};

	const topCitiesReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topCitiesReportOptions,
			configuredAudiences
		)
	);

	const topCitiesReportLoaded = useReportLoaded(
		topCitiesReportOptions,
		configuredAudiences
	);

	const topCitiesReportErrors = useReportErrors(
		topCitiesReportOptions,
		configuredAudiences
	);

	const topContentReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		dimensionFilters: {
			'customEvent:googlesitekit_post_type': {
				filterType: 'stringFilter',
				matchType: 'EXACT',
				value: 'post',
			},
		},
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 3,
	};
	const topContentReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topContentReportOptions,
			configuredAudiences
		)
	);
	const topContentReportLoaded = useReportLoaded(
		topContentReportOptions,
		configuredAudiences
	);

	const topContentReportErrors = useReportErrors(
		topContentReportOptions,
		configuredAudiences
	);

	const topContentPageTitlesReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		dimensionFilters: {
			'customEvent:googlesitekit_post_type': {
				filterType: 'stringFilter',
				matchType: 'EXACT',
				value: 'post',
			},
		},
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
	};
	const topContentPageTitlesReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topContentPageTitlesReportOptions,
			configuredAudiences
		)
	);
	const topContentPageTitlesReportLoaded = useReportLoaded(
		topContentPageTitlesReportOptions,
		configuredAudiences
	);

	const topContentPageTitlesReportErrors = useReportErrors(
		topContentPageTitlesReportOptions,
		configuredAudiences
	);

	return {
		report,
		reportLoaded,
		reportError,
		siteKitAudiencesReport,
		siteKitAudiencesReportLoaded,
		siteKitAudiencesReportError,
		totalPageviews,
		totalPageviewsReportLoaded,
		totalPageviewsReportError,
		topCitiesReport,
		topCitiesReportLoaded,
		topCitiesReportErrors,
		topContentReport,
		topContentReportLoaded,
		topContentReportErrors,
		topContentPageTitlesReport,
		topContentPageTitlesReportLoaded,
		topContentPageTitlesReportErrors,
	};
}
