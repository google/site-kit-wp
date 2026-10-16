/**
 * ModulePopularPagesWidgetGA4 Component Stories.
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
import { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { properties } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { provideRecentContent } from '@/js/modules/analytics-4/datastore/test-utils';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import {
	STRATEGY_ZIP,
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '@/js/modules/analytics-4/utils/data-mock';
import { Story } from '@/js/types/Story';
import { DAY_IN_SECONDS } from '@/js/util';
import { replaceValuesInAnalytics4ReportWithZeroData } from '@/js/util/zero-reports';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import { getLatestContentReportArgs } from './latestContentReportOptions';
import ModulePopularPagesWidgetGA4 from '.';

const reportOptions: ReportOptions[] = [
	{
		// Popular pages report.
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensions: [ 'pagePath' ],
		metrics: [
			{
				name: 'screenPageViews',
			},
			{
				name: 'sessions',
			},
			{
				name: 'engagementRate',
			},
			{
				name: 'averageSessionDuration',
			},
		],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 10,
		reportID: 'analytics-4_module-popular-pages-widget-ga4_widget_args',
	},
	{
		// Page titles report.
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensionFilters: {
			pagePath: new Array( 10 )
				.fill( '' )
				.map( ( _, index ) => `/test-post-${ index + 1 }/` )
				.sort(),
		},
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 50,
		reportID: 'analytics-4_get-page-titles_store:selector_options',
	},
	{
		// Gathering/zero data report.
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate: '2020-11-11',
		endDate: '2021-01-05',
	},
];

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	ModulePopularPagesWidgetGA4
);

function Template( {
	setupRegistry,
	...args
}: {
	setupRegistry: ( registry: WPDataRegistry ) => void;
} ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

export const Loaded = Template.bind( {} ) as Story;
Loaded.storyName = 'Loaded';
Loaded.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		const pageTitlesReportOptions = reportOptions[ 1 ];

		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
			// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
			// page paths to page titles.
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );

		for ( const options of [ reportOptions[ 0 ], reportOptions[ 2 ] ] ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};
Loaded.scenario = {};

export const Loading = Template.bind( {} ) as Story & {
	decorators?: ( ( StoryComponent: ComponentType ) => JSX.Element )[];
};
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch }: WPDataRegistry ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions[ 0 ],
		] );
	},
};
Loading.decorators = [
	( StoryComponent: ComponentType ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<StoryComponent />
			</div>
		);
	},
];
Loading.scenario = {};

export const DataUnavailable = Template.bind( {} ) as Story;
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.args = {
	setupRegistry: ( { dispatch }: WPDataRegistry ) => {
		const propertyID = properties[ 0 ]._id;
		// Set the property creation timestamp to one and a half days ago, so that
		// the property is considered to be in the gathering data state.
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 1.5 * 1000
		).toISOString();

		const property = {
			...properties[ 0 ],
			createTime,
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty( property, {
			propertyID,
		} );
		dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );

		const gatheringReportOptions = reportOptions[ 2 ];

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			replaceValuesInAnalytics4ReportWithZeroData(
				getAnalytics4MockResponse( gatheringReportOptions )
			),
			{
				options: gatheringReportOptions,
			}
		);

		for ( const options of reportOptions ) {
			dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				replaceValuesInAnalytics4ReportWithZeroData(
					getAnalytics4MockResponse( options )
				),
				{ options }
			);
		}
	},
};
DataUnavailable.scenario = {};

export const ZeroData = Template.bind( {} ) as Story;
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch }: WPDataRegistry ) => {
		const propertyID = properties[ 0 ]._id;
		dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );

		dispatch( MODULES_ANALYTICS_4 ).setPropertyCreateTime(
			properties[ 0 ].createTime
		);

		for ( const options of reportOptions ) {
			const report = getAnalytics4MockResponse( options );

			dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				replaceValuesInAnalytics4ReportWithZeroData( report ),
				{
					options,
				}
			);
		}
	},
};
ZeroData.scenario = {};

export const Error = Template.bind( {} ) as Story;
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};
		const reportArgs = [ reportOptions[ 0 ] ];

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( error, 'getReport', reportArgs );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', reportArgs );

		for ( const options of reportOptions.slice( 1 ) ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};
Error.scenario = {};

const RECENT_CONTENT: RecentContentItem[] = [
	[ 'Holiday opening hours', 'holiday-opening-hours', '2021-01-05T08:15:00' ],
	[ 'New year, new menu', 'new-year-new-menu', '2021-01-03T17:40:00' ],
	[
		'Our favourite recipes of the year',
		'favourite-recipes-of-the-year',
		'2020-12-30T11:05:00',
	],
	[ 'Gift guide for food lovers', 'gift-guide', '2020-12-18T09:30:00' ],
	[ 'Behind the scenes', 'behind-the-scenes', '2020-12-11T14:20:00' ],
].map( ( [ title, slug, sitePublishedAt ], index ) => ( {
	id: index + 1,
	title,
	permalink: `http://example.com/${ slug }/`,
	pagePath: `/${ slug }/`,
	publishedAt: `${ sitePublishedAt }Z`,
	sitePublishedAt,
} ) );

const LATEST_CONTENT_REPORT_OPTIONS = getLatestContentReportArgs(
	{ startDate: '2020-12-09', endDate: '2021-01-05' },
	RECENT_CONTENT.map( ( { pagePath } ) => pagePath )
);

// The newest post has no traffic yet, so it has no row in the report.
const LATEST_CONTENT_REPORT = {
	rows: [
		[ '/new-year-new-menu/', '342', '287', '0.62', '94' ],
		[ '/favourite-recipes-of-the-year/', '1205', '980', '0.71', '156' ],
		[ '/gift-guide/', '2310', '1874', '0.58', '121' ],
		[ '/behind-the-scenes/', '488', '402', '0.66', '83' ],
	].map( ( [ pagePath, ...metrics ] ) => ( {
		dimensionValues: [ { value: pagePath } ],
		metricValues: metrics.map( ( value ) => ( { value } ) ),
	} ) ),
};

export const TopContentFreshData = Template.bind( {} ) as Story;
TopContentFreshData.storyName = 'Top Content (freshData enabled)';
TopContentFreshData.args = {
	setupRegistry: Loaded.args?.setupRegistry,
};
TopContentFreshData.parameters = {
	features: [ 'freshData' ],
};
TopContentFreshData.scenario = {};

export const LatestContent = Template.bind( {} ) as Story;
LatestContent.storyName = 'Latest Content (freshData enabled)';
LatestContent.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		Loaded.args?.setupRegistry?.( registry );
		provideRecentContent( registry, RECENT_CONTENT, { count: 10 } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( LATEST_CONTENT_REPORT, {
				options: LATEST_CONTENT_REPORT_OPTIONS,
			} );
	},
};
LatestContent.parameters = {
	features: [ 'freshData' ],
};
LatestContent.scenario = {
	clickSelector: '#googlesitekit-latest-content-tab',
};

export const LatestContentReportError = Template.bind( {} ) as Story;
LatestContentReportError.storyName =
	'Latest Content, Report Error (freshData enabled)';
LatestContentReportError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		Loaded.args?.setupRegistry?.( registry );
		provideRecentContent( registry, RECENT_CONTENT, { count: 10 } );
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'Error message.',
				data: {},
			},
			'getReport',
			[ LATEST_CONTENT_REPORT_OPTIONS ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ LATEST_CONTENT_REPORT_OPTIONS ] );
	},
};
LatestContentReportError.parameters = {
	features: [ 'freshData' ],
};
LatestContentReportError.scenario = {
	clickSelector: '#googlesitekit-latest-content-tab',
};

export const LatestContentNoPublishedPosts = Template.bind( {} ) as Story;
LatestContentNoPublishedPosts.storyName =
	'Latest Content, No Published Posts (freshData enabled)';
LatestContentNoPublishedPosts.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		Loaded.args?.setupRegistry?.( registry );
		provideRecentContent( registry, [], { count: 10 } );
	},
};
LatestContentNoPublishedPosts.parameters = {
	features: [ 'freshData' ],
};

export default {
	title: 'Modules/Analytics4/Widgets/ModulePopularPagesWidgetGA4',
	decorators: [
		(
			StoryComponent: ComponentType,
			{
				args,
			}: { args: { setupRegistry: ( registry: WPDataRegistry ) => void } }
		) => {
			function setupRegistry( registry: WPDataRegistry ) {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-05' );

				// Call story-specific setup.
				args.setupRegistry( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
