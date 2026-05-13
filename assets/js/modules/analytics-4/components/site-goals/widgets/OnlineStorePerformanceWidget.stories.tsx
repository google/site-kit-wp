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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

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
import OnlineStorePerformanceWidget from './OnlineStorePerformanceWidget';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import { Story } from '@/js/types/Story';

// Reference date: 2020-09-07, offsetDays: 0, 28-day range with comparison.
const dates = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
};

function buildPrimaryEventReportOptions( primaryEvent: string ) {
	return {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ { name: 'eventName' } ],
		dimensionFilters: {
			eventName: primaryEvent,
		},
		reportID:
			'analytics-4_online-store-performance-widget_primaryEventReportOptions',
	};
}

const engagementReportOptions = {
	...dates,
	metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
	reportID: 'analytics-4_site-goals_engagementReportOptions',
};

const purchaseReportOptions = buildPrimaryEventReportOptions(
	ENUM_CONVERSION_EVENTS.PURCHASE
);

const addToCartReportOptions = buildPrimaryEventReportOptions(
	ENUM_CONVERSION_EVENTS.ADD_TO_CART
);

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsOnlineStorePerformance'
)( OnlineStorePerformanceWidget );

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
		.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

	registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-07' );

	provideKeyMetrics( registry );
}

function seedGoalDriverReports(
	registry: WPDataRegistry,
	eventNames: string[],
	{
		goalType = GOAL_TYPES.ECOMMERCE,
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
	const isAddToCart = eventNames.includes(
		ENUM_CONVERSION_EVENTS.ADD_TO_CART
	);
	const trafficRows = isAddToCart
		? [
				{
					dimensionValues: [ { value: 'Direct' } ],
					metricValues: [ { value: '41' } ],
				},
				{
					dimensionValues: [ { value: 'Paid Search' } ],
					metricValues: [ { value: '30' } ],
				},
				{
					dimensionValues: [ { value: 'Organic Search' } ],
					metricValues: [ { value: '19' } ],
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
				{
					dimensionValues: [ { value: 'Referral' } ],
					metricValues: [ { value: '9' } ],
				},
				{
					dimensionValues: [ { value: 'Email' } ],
					metricValues: [ { value: '6' } ],
				},
		  ];
	const totalEventCount = isAddToCart ? '90' : '108';
	const pageEventCounts = isAddToCart
		? [ '47', '31', '18' ]
		: [ '30', '25', '20' ];
	const pageTitlePrefix = isAddToCart ? 'Cart page' : 'Sales page';
	const visitorTypeRows = isAddToCart
		? [
				{
					dimensionValues: [ { value: 'new' } ],
					metricValues: [ { value: '71' } ],
				},
				{
					dimensionValues: [ { value: 'returning' } ],
					metricValues: [ { value: '29' } ],
				},
		  ]
		: [
				{
					dimensionValues: [ { value: 'new' } ],
					metricValues: [ { value: '58' } ],
				},
				{
					dimensionValues: [ { value: 'returning' } ],
					metricValues: [ { value: '42' } ],
				},
		  ];

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
									ENUM_CONVERSION_EVENTS.PURCHASE,
							},
						],
						metricValues: [ { value: pageEventCounts[ index ] } ],
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
							{ value: `${ pageTitlePrefix } ${ index + 1 }` },
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
			rows: empty ? [] : visitorTypeRows,
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
Ready.storyName = 'Ready (Purchase)';
Ready.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );
		provideAnalytics4MockReport( registry, purchaseReportOptions );
		provideAnalytics4MockReport( registry, engagementReportOptions );
		seedGoalDriverReports( registry, [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
	},
};

export const ReadyAddToCart = Template.bind( {} ) as Story;
ReadyAddToCart.storyName = 'Ready (Add to Cart)';
ReadyAddToCart.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );
		provideAnalytics4MockReport( registry, addToCartReportOptions );
		provideAnalytics4MockReport( registry, engagementReportOptions );
		seedGoalDriverReports( registry, [
			ENUM_CONVERSION_EVENTS.ADD_TO_CART,
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
			.startResolution( 'getReport', [ purchaseReportOptions ] );
		seedGoalDriverReports( registry, [ ENUM_CONVERSION_EVENTS.PURCHASE ], {
			loading: true,
		} );
	},
};

export const ZeroData = Template.bind( {} ) as Story;
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		commonSetup( registry );

		const report = getAnalytics4MockResponse( purchaseReportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: purchaseReportOptions,
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
		seedGoalDriverReports( registry, [ ENUM_CONVERSION_EVENTS.PURCHASE ], {
			empty: true,
		} );
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
				purchaseReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ purchaseReportOptions ] );
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
				purchaseReportOptions,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ purchaseReportOptions ] );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/OnlineStorePerformanceWidget',
	component: OnlineStorePerformanceWidget,
};
