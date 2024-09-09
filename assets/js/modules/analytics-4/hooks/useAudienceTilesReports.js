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
		[ shouldFetchReport ]
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
		[ shouldFetchSiteKitAudiencesReport ]
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
		limit: 3,
	};

	const topCitiesReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topCitiesReportOptions,
			configuredAudiences
		)
	);

	const topCitiesReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( ( audienceResourceName ) =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				{
					...topCitiesReportOptions,
					dimensionFilters: { audienceResourceName },
				},
			] )
		)
	);

	const topCitiesReportErrors = useSelect( ( select ) => {
		return configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[
					{
						...topCitiesReportOptions,
						dimensionFilters: { audienceResourceName },
					},
				]
			);

			if ( error ) {
				acc[ audienceResourceName ] = error;
			}

			return acc;
		}, {} );
	} );

	const topContentReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 3,
	};
	const topContentReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topContentReportOptions,
			configuredAudiences
		)
	);
	const topContentReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( ( audienceResourceName ) =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				{
					...topContentReportOptions,
					dimensionFilters: { audienceResourceName },
				},
			] )
		)
	);
	const topContentReportErrors = useSelect( ( select ) => {
		return configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[
					{
						...topContentReportOptions,
						dimensionFilters: { audienceResourceName },
					},
				]
			);

			if ( error ) {
				acc[ audienceResourceName ] = error;
			}

			return acc;
		}, {} );
	} );

	const topContentPageTitlesReportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
	};
	const topContentPageTitlesReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReportForAllAudiences(
			topContentPageTitlesReportOptions,
			configuredAudiences
		)
	);
	const topContentPageTitlesReportLoaded = useSelect( ( select ) =>
		configuredAudiences.every( ( audienceResourceName ) =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				{
					...topContentPageTitlesReportOptions,
					dimensionFilters: { audienceResourceName },
				},
			] )
		)
	);
	const topContentPageTitlesReportErrors = useSelect( ( select ) => {
		return configuredAudiences.reduce( ( acc, audienceResourceName ) => {
			const error = select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[
					{
						...topContentPageTitlesReportOptions,
						dimensionFilters: { audienceResourceName },
					},
				]
			);

			if ( error ) {
				acc[ audienceResourceName ] = error;
			}

			return acc;
		}, {} );
	} );

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
