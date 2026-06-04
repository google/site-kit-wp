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
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import { surveyTriggerEndpoint } from '../../../../../../../tests/js/mock-survey-endpoints';
import OnlineStorePerformanceWidget from './OnlineStorePerformanceWidget';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'OnlineStorePerformanceWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		'analyticsOnlineStorePerformance'
	);

	function buildPrimaryEventReportOptions(
		dates: Record< string, unknown >,
		primaryEvent: string
	) {
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

	function buildEngagementReportOptions( dates: Record< string, unknown > ) {
		return {
			...dates,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			reportID: 'analytics-4_site-goals_engagementReportOptions',
		};
	}

	function buildVisitorEngagementEventReportOptions(
		dates: Record< string, unknown >,
		eventName: string
	) {
		return {
			...dates,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName,
			},
			reportID: `analytics-4_site-goals_visitor-engagement_${ eventName }`,
		};
	}

	function seedGoalDriverReports(
		eventNames: string[],
		{
			empty = false,
			loading = false,
		}: { empty?: boolean; loading?: boolean } = {}
	) {
		const dates = registry.select( CORE_USER ).getDateRangeDates();

		const dimensionFilters = {
			eventName: {
				filterType: 'inListFilter',
				value: eventNames,
			},
		};

		const topTrafficChannelsOptions = {
			...dates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-traffic-channels_${ GOAL_TYPES.ECOMMERCE }`,
		};

		const topTrafficTotalOptions = {
			...dates,
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			reportID: `analytics-4_site-goals_top-traffic-channels-total_${ GOAL_TYPES.ECOMMERCE }`,
		};

		const topTrafficRateOptions = {
			...dates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters,
			metrics: [ { name: 'eventCount' }, { name: 'sessions' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-traffic-channels-rate_${ GOAL_TYPES.ECOMMERCE }`,
		};

		const topPagesOptions = {
			...dates,
			dimensions: [ 'pagePath', 'eventName' ],
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-pages_${ GOAL_TYPES.ECOMMERCE }`,
		};

		const pagePaths = [ '/test-post-1/', '/test-post-2/', '/test-post-3/' ];
		const pageTitlesOptions = {
			startDate: dates.startDate,
			endDate: dates.endDate,
			dimensions: [ 'pagePath', 'pageTitle' ],
			dimensionFilters: {
				pagePath: [ ...pagePaths ].sort(),
			},
			metrics: [ { name: 'screenPageViews' } ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 15,
			reportID: 'analytics-4_get-page-titles_store:selector_options',
		};

		const visitorTypeOptions = {
			...dates,
			dimensions: [ 'newVsReturning' ],
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_visitor-type_${ GOAL_TYPES.ECOMMERCE }`,
		};

		const citiesOptions = {
			...dates,
			dimensions: [ 'city' ],
			dimensionFilters: {
				...dimensionFilters,
				city: {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_cities_${ GOAL_TYPES.ECOMMERCE }`,
		};

		const countriesOptions = {
			...dates,
			dimensions: [ 'country' ],
			dimensionFilters: {
				...dimensionFilters,
				country: {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_countries_${ GOAL_TYPES.ECOMMERCE }`,
		};

		const deviceTypeOptions = {
			...dates,
			dimensions: [ 'deviceCategory' ],
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_device-type_${ GOAL_TYPES.ECOMMERCE }`,
		};

		if ( loading ) {
			[
				topTrafficChannelsOptions,
				topTrafficTotalOptions,
				topTrafficRateOptions,
				topPagesOptions,
				pageTitlesOptions,
				visitorTypeOptions,
				citiesOptions,
				countriesOptions,
				deviceTypeOptions,
			].forEach( ( options ) => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.startResolution( 'getReport', [ options ] );
			} );

			return;
		}

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: empty
					? []
					: [
							{
								dimensionValues: [
									{ value: 'Organic Search' },
								],
								metricValues: [ { value: '54' } ],
							},
							{
								dimensionValues: [ { value: 'Direct' } ],
								metricValues: [ { value: '23' } ],
							},
							{
								dimensionValues: [
									{ value: 'Organic Social' },
								],
								metricValues: [ { value: '16' } ],
							},
					  ],
			},
			{ options: topTrafficChannelsOptions }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ topTrafficChannelsOptions ] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: empty ? [] : [ { metricValues: [ { value: '100' } ] } ],
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
					: [
							{
								dimensionValues: [ { value: 'Direct' } ],
								metricValues: [
									{ value: '75' },
									{ value: '1000' },
								],
							},
							{
								dimensionValues: [
									{ value: 'Organic Search' },
								],
								metricValues: [
									{ value: '47' },
									{ value: '1000' },
								],
							},
							{
								dimensionValues: [
									{ value: 'Organic Social' },
								],
								metricValues: [
									{ value: '12' },
									{ value: '1000' },
								],
							},
					  ],
			},
			{ options: topTrafficRateOptions }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ topTrafficRateOptions ] );

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
							metricValues: [
								{ value: String( 30 - index * 5 ) },
							],
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
							metricValues: [
								{ value: String( 100 - index * 10 ) },
							],
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

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: empty
					? []
					: [
							{
								dimensionValues: [ { value: 'London' } ],
								metricValues: [ { value: '33' } ],
							},
							{
								dimensionValues: [ { value: 'New York' } ],
								metricValues: [ { value: '28' } ],
							},
							{
								dimensionValues: [ { value: 'Paris' } ],
								metricValues: [ { value: '21' } ],
							},
					  ],
			},
			{ options: citiesOptions }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ citiesOptions ] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: empty
					? []
					: [
							{
								dimensionValues: [ { value: 'United States' } ],
								metricValues: [ { value: '48' } ],
							},
							{
								dimensionValues: [
									{ value: 'United Kingdom' },
								],
								metricValues: [ { value: '24' } ],
							},
							{
								dimensionValues: [ { value: 'Germany' } ],
								metricValues: [ { value: '13' } ],
							},
					  ],
			},
			{ options: countriesOptions }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ countriesOptions ] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: empty
					? []
					: [
							{
								dimensionValues: [ { value: 'desktop' } ],
								metricValues: [ { value: '51' } ],
							},
							{
								dimensionValues: [ { value: 'mobile' } ],
								metricValues: [ { value: '39' } ],
							},
							{
								dimensionValues: [ { value: 'tablet' } ],
								metricValues: [ { value: '18' } ],
							},
					  ],
			},
			{ options: deviceTypeOptions }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ deviceTypeOptions ] );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSiteGoalsSettings( {} );
	} );

	it( 'renders WidgetNull when no ecommerce events are detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		const { container, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders WidgetNull when detected events array is empty', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		const { container, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the primary action section with purchase primary event', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { container, getAllByText, getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-site-goals-primary-action'
			)
		).toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-site-goals-tile' )
		).toHaveLength( 3 ); // Sales Rate + Total Sales + Engagement rate
		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		expect( getByText( '“purchase” events' ) ).toBeInTheDocument();
		expect( getByText( 'Engagement rate' ) ).toBeInTheDocument();
		expect(
			getByText( 'What’s helping you reach your goals?' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by total sales' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by sales rate' )
		).toBeInTheDocument();
		expect( getByText( 'Sales by visitor type' ) ).toBeInTheDocument();
		expect( getAllByText( 'Organic Search' ).length ).toBeGreaterThan( 0 );
		expect(
			container.querySelectorAll(
				'.googlesitekit-site-goals-goal-drivers-section__tile:not(.googlesitekit-site-goals-goal-drivers-section__tile--empty)'
			)
		).toHaveLength( 3 );
	} );

	it( 'renders a collapsible widget', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByRole, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			getByRole( 'button', {
				name: 'Hide section',
			} )
		).toBeInTheDocument();
	} );

	it( 'falls back to add_to_cart when purchase is not detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.ADD_TO_CART
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Add to Cart Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Products added to cart' ) ).toBeInTheDocument();
		expect( getByText( '“add_to_cart” events' ) ).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by total sales' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by sales rate' )
		).toBeInTheDocument();
		expect( getByText( 'Sales by visitor type' ) ).toBeInTheDocument();
	} );

	it( 'uses purchase as primary event when both purchase and add_to_cart are detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		const secondaryEventsReport = buildVisitorEngagementEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.ADD_TO_CART
		);
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );
		provideAnalytics4MockReport( registry, secondaryEventsReport );

		const { getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by total sales' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by sales rate' )
		).toBeInTheDocument();
		expect( getByText( 'Sales by visitor type' ) ).toBeInTheDocument();
	} );

	it( 'computes zero rate when sessions count is zero', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ], {
			empty: true,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [] }, { options: primaryEventReport } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ primaryEventReport ] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { totals: [] }, { options: engagementReport } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ engagementReport ] );

		const { getAllByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getAllByText( '0%' ).length ).toBeGreaterThanOrEqual( 1 );
		expect(
			getAllByText( /No data to display: .* any sales yet/i ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'renders loading state while reports are being resolved', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ], {
			loading: true,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ primaryEventReport ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ engagementReport ] );

		const { container, unmount } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);

		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-goal-drivers-group'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-goal-drivers-group .googlesitekit-preview-block'
			)
		).toBeInTheDocument();
		unmount();
	} );

	it( 'renders goal drivers loading state while primary section stays visible', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ], {
			loading: true,
		} );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { container, unmount, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-site-goals-primary-action'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-goal-drivers-group'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-goal-drivers-group .googlesitekit-preview-block'
			)
		).toBeInTheDocument();
		unmount();
	} );

	it( 'renders goal drivers error state without replacing the full widget', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );
		const goalDriverDates = registry
			.select( CORE_USER )
			.getDateRangeDates();

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const goalDriverReportOptions = {
			...goalDriverDates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-traffic-channels_${ GOAL_TYPES.ECOMMERCE }`,
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 400,
				message: 'Data loading failed',
				data: {
					status: 400,
					reason: 'badRequest',
				},
			},
			'getReport',
			[ goalDriverReportOptions ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ goalDriverReportOptions ] );

		const { container, getByText, waitForRegistry, unmount } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Data loading failed' ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-primary-action'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-goal-drivers-group'
			)
		).toBeInTheDocument();
		unmount();
	} );

	it( 'renders engagement rate tile with compare values', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Engagement rate' ) ).toBeInTheDocument();
		expect(
			getByText( 'How are your visitors engaging?' )
		).toBeInTheDocument();
	} );

	it( 'renders add_to_cart secondary tile when primary is purchase', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		const secondaryEventsReport = buildVisitorEngagementEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.ADD_TO_CART
		);
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.ADD_TO_CART },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '50' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.ADD_TO_CART },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '40' } ],
					},
				],
			},
			{ options: secondaryEventsReport }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ secondaryEventsReport ] );

		const { getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Products added to cart' ) ).toBeInTheDocument();
		expect( getByText( '“add_to_cart” events' ) ).toBeInTheDocument();
	} );

	it( 'renders secondary visitor engagement loading state without replacing primary tiles', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		const visitorEngagementReport =
			buildVisitorEngagementEventReportOptions(
				dates,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART
			);
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ visitorEngagementReport ] );

		const { container, getByText, unmount, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		expect( getByText( 'Products added to cart' ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-visitor-engagement .googlesitekit-preview-block'
			)
		).toBeInTheDocument();
		unmount();
	} );

	it( 'renders secondary visitor engagement error state without replacing primary tiles', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		const visitorEngagementReport =
			buildVisitorEngagementEventReportOptions(
				dates,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART
			);
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 400,
				message: 'Data loading failed',
				data: {
					status: 400,
					reason: 'badRequest',
				},
			},
			'getReport',
			[ visitorEngagementReport ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ visitorEngagementReport ] );

		const { getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		expect( getByText( 'Products added to cart' ) ).toBeInTheDocument();
		expect( getByText( 'Data loading failed' ) ).toBeInTheDocument();
	} );

	it( 'does not render add_to_cart secondary tile when deselected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			visitorEngagement: {
				[ GOAL_TYPES.ECOMMERCE ]: [],
				[ GOAL_TYPES.LEAD ]: [],
			},
		} );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByText, queryByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Engagement rate' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Products added to cart' )
		).not.toBeInTheDocument();
		expect( queryByText( '“add_to_cart” events' ) ).not.toBeInTheDocument();
	} );

	it( 'does not render secondary add_to_cart tile when primary is add_to_cart', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.ADD_TO_CART
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getAllByText, queryByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// "Products added to cart" appears exactly once — in the primary action section only.
		// No secondary ecommerce tile should appear in the visitor engagement section.
		expect( getAllByText( 'Products added to cart' ) ).toHaveLength( 1 );
		// Primary add_to_cart tile in primary action should still render.
		expect( queryByText( '“add_to_cart” events' ) ).toBeInTheDocument();
		// No additional secondary add_to_cart subtitle in visitor engagement section.
		expect(
			queryByText( 'How are your visitors engaging?' )
		).toBeInTheDocument();
	} );

	it( 'dispatches an up vote on thumbs-up click', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByRole, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID: 'vote:site_goals_widget_online_store:up',
					},
				},
			} )
		);
	} );

	it( 'dispatches a down vote on thumbs-down click', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByRole, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID: 'vote:site_goals_widget_online_store:down',
					},
				},
			} )
		);
	} );
} );
