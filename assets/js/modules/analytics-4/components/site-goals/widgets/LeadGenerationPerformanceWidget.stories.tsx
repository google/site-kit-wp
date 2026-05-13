/**
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	MODULES_ANALYTICS_4,
	ENUM_CONVERSION_EVENTS,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '@/js/modules/analytics-4/utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '@/js/util/zero-reports';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import LeadGenerationPerformanceWidget from './LeadGenerationPerformanceWidget';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import { Story } from '@/js/types/Story';
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

// Reference date: 2020-09-07, offsetDays: 0, 28-day range with comparison.
const dates = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
};

function buildLeadEventsReportOptions( leadEvents: string[] ) {
	return {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ { name: 'eventName' } ],
		dimensionFilters: {
			eventName: {
				filterType: 'inListFilter',
				value: leadEvents,
			},
		},
		reportID:
			'analytics-4_lead-generation-performance-widget_widget_leadEventsReportOptions',
	};
}

const engagementReportOptions = {
	...dates,
	metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
	reportID: 'analytics-4_site-goals_engagementReportOptions',
};

const singleEventReportOptions = buildLeadEventsReportOptions( [
	ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
] );

const multipleEventsReportOptions = buildLeadEventsReportOptions( [
	ENUM_CONVERSION_EVENTS.CONTACT,
	ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
] );

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsLeadGenerationPerformance'
)( LeadGenerationPerformanceWidget );

function commonSetup( registry: WPDataRegistry ) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );

	provideModuleRegistrations( registry );

	registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '34567' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setWebDataStreamID( '56789' );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

	registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-07' );

	provideKeyMetrics( registry );
}

function seedGoalDriverReports(
	registry: WPDataRegistry,
	eventNames: string[],
	{
		goalType = GOAL_TYPES.LEAD,
		empty = false,
		loading = false,
	}: { goalType?: string; empty?: boolean; loading?: boolean } = {}
) {
	const goalDriverDates = {
		startDate: dates.startDate,
		endDate: dates.endDate,
	};

	const dimensionFilters = {
		eventName: {
			filterType: 'inListFilter',
			value: eventNames,
		},
	};

	const topTrafficChannelsOptions = {
		...goalDriverDates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		dimensionFilters,
		metrics: [ { name: 'eventCount' } ],
		orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
		keepEmptyRows: false,
		reportID: `analytics-4_site-goals_top-traffic-channels_${ goalType }`,
	};

	const topTrafficTotalOptions = {
		...goalDriverDates,
		dimensionFilters,
		metrics: [ { name: 'eventCount' } ],
		reportID: `analytics-4_site-goals_top-traffic-channels-total_${ goalType }`,
	};

	const topPagesOptions = {
		...goalDriverDates,
		dimensions: [ 'pagePath', 'eventName' ],
		dimensionFilters,
		metrics: [ { name: 'eventCount' } ],
		orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
		keepEmptyRows: false,
		reportID: `analytics-4_site-goals_top-pages_${ goalType }`,
	};

	const pagePaths = [ '/test-post-1/', '/test-post-2/', '/test-post-3/' ];
	const pageTitlesOptions = {
		...goalDriverDates,
		dimensions: [ 'pagePath', 'pageTitle' ],
		dimensionFilters: {
			pagePath: [ ...pagePaths ].sort(),
		},
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
		reportID: 'analytics-4_get-page-titles_store:selector_options',
	};

	const visitorTypeOptions = {
		...goalDriverDates,
		dimensions: [ 'newVsReturning' ],
		dimensionFilters,
		metrics: [ { name: 'eventCount' } ],
		orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
		keepEmptyRows: false,
		reportID: `analytics-4_site-goals_visitor-type_${ goalType }`,
	};

	if ( loading ) {
		[
			topTrafficChannelsOptions,
			topTrafficTotalOptions,
			topPagesOptions,
			pageTitlesOptions,
			visitorTypeOptions,
		].forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ options ] );
		} );

		return;
	}
	const hasMultipleEvents = eventNames.length > 1;
	const trafficRows = hasMultipleEvents
		? [
				{
					dimensionValues: [ { value: 'Organic Search' } ],
					metricValues: [ { value: '34' } ],
				},
				{
					dimensionValues: [ { value: 'Direct' } ],
					metricValues: [ { value: '27' } ],
				},
				{
					dimensionValues: [ { value: 'Referral' } ],
					metricValues: [ { value: '18' } ],
				},
				{
					dimensionValues: [ { value: 'Paid Search' } ],
					metricValues: [ { value: '12' } ],
				},
				{
					dimensionValues: [ { value: 'Organic Social' } ],
					metricValues: [ { value: '9' } ],
				},
		  ]
		: [
				{
					dimensionValues: [ { value: 'Organic Search' } ],
					metricValues: [ { value: '54' } ],
				},
				{
					dimensionValues: [ { value: 'Direct' } ],
					metricValues: [ { value: '23' } ],
				},
				{
					dimensionValues: [ { value: 'Organic Social' } ],
					metricValues: [ { value: '16' } ],
				},
		  ];
	const totalEventCount = hasMultipleEvents ? '100' : '93';

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: empty ? [] : trafficRows,
		},
		{ options: topTrafficChannelsOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ topTrafficChannelsOptions ] );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: empty
				? []
				: [ { metricValues: [ { value: totalEventCount } ] } ],
		},
		{ options: topTrafficTotalOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ topTrafficTotalOptions ] );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: empty
				? []
				: pagePaths.map( ( pagePath, index ) => ( {
						dimensionValues: [
							{ value: pagePath },
							{
								value:
									eventNames[ 0 ] ||
									ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
							},
						],
						metricValues: [ { value: String( 30 - index * 5 ) } ],
				  } ) ),
		},
		{ options: topPagesOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ topPagesOptions ] );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: empty
				? []
				: pagePaths.map( ( pagePath, index ) => ( {
						dimensionValues: [
							{ value: pagePath },
							{ value: `Test page ${ index + 1 }` },
						],
						metricValues: [ { value: String( 100 - index * 10 ) } ],
				  } ) ),
		},
		{ options: pageTitlesOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ pageTitlesOptions ] );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: empty
				? []
				: [
						{
							dimensionValues: [ { value: 'new' } ],
							metricValues: [ { value: '58' } ],
						},
						{
							dimensionValues: [ { value: 'returning' } ],
							metricValues: [ { value: '42' } ],
						},
				  ],
		},
		{ options: visitorTypeOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ visitorTypeOptions ] );
}

function Template( {
	setupRegistry,
}: {
	setupRegistry: ( registry: WPDataRegistry ) => void;
} ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps />
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} ) as Story;
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );
		provideAnalytics4MockReport( registry, singleEventReportOptions );
		provideAnalytics4MockReport( registry, engagementReportOptions );
		seedGoalDriverReports( registry, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
	},
};

export const ReadyMultipleEvents = Template.bind( {} ) as Story;
ReadyMultipleEvents.storyName = 'Ready (Multiple Events)';
ReadyMultipleEvents.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.CONTACT,
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
			] );
		provideAnalytics4MockReport( registry, multipleEventsReportOptions );
		provideAnalytics4MockReport( registry, engagementReportOptions );
		seedGoalDriverReports( registry, [
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
	},
};

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ singleEventReportOptions ] );
		seedGoalDriverReports(
			registry,
			[ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
			{ loading: true }
		);
	},
};

export const ZeroData = Template.bind( {} ) as Story;
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );

		const report = getAnalytics4MockResponse( singleEventReportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: singleEventReportOptions,
		} );

		const sessionsReport = getAnalytics4MockResponse(
			engagementReportOptions
		);
		const zeroSessionsReport =
			replaceValuesInAnalytics4ReportWithZeroData( sessionsReport );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( zeroSessionsReport, {
				options: engagementReportOptions,
			} );
		seedGoalDriverReports(
			registry,
			[ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
			{ empty: true }
		);
	},
};

export const Error = Template.bind( {} ) as Story;
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );

		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( errorObject, 'getReport', [
				singleEventReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ singleEventReportOptions ] );
	},
};

export const InsufficientPermissions = Template.bind( {} ) as Story;
InsufficientPermissions.storyName = 'Insufficient Permissions';
InsufficientPermissions.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );

		const errorObject = {
			code: 403,
			message: 'Test error message. ',
			data: {
				status: 403,
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( errorObject, 'getReport', [
				singleEventReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ singleEventReportOptions ] );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/LeadGenerationPerformanceWidget',
	component: LeadGenerationPerformanceWidget,
};
