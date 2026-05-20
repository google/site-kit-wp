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
	type WidgetComponentProps,
	getWidgetComponentProps,
} from '@/js/googlesitekit/widgets/util';
import {
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	DATE_RANGE_OFFSET,
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { render } from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
} from '../../../../../../../tests/js/utils';
import OnlineStorePerformanceWidget from './OnlineStorePerformanceWidget';

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

	function buildSecondaryEventsReportOptions(
		dates: Record< string, unknown >,
		secondaryEvents: string[]
	) {
		return {
			...dates,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: secondaryEvents,
				},
			},
			reportID:
				'analytics-4_online-store-performance-widget_secondaryEventsReportOptions',
		};
	}

	function seedGoalDriverReports(
		eventNames: string[],
		{
			empty = false,
			loading = false,
		}: { empty?: boolean; loading?: boolean } = {}
	) {
		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

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
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
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
			offsetDays: DATE_RANGE_OFFSET,
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

		const { container, getByText, waitForRegistry } = render(
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
		).toHaveLength( 2 );
		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		expect( getByText( '“purchase” events' ) ).toBeInTheDocument();
		expect(
			getByText( 'What’s helping you reach your goals?' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels driving sales' )
		).toBeInTheDocument();
		expect( getByText( 'Top pages driving sales' ) ).toBeInTheDocument();
		expect( getByText( 'Sales by visitor type' ) ).toBeInTheDocument();
		expect( getByText( 'Organic Search' ) ).toBeInTheDocument();
		expect(
			container.querySelectorAll(
				'.googlesitekit-site-goals-goal-drivers-section__tile'
			)
		).toHaveLength( 3 );
	} );

	it( 'renders a collapsible widget', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
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
			offsetDays: DATE_RANGE_OFFSET,
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
		expect(
			getByText( 'Total products added to cart' )
		).toBeInTheDocument();
		expect( getByText( '“add_to_cart” events' ) ).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels driving sales' )
		).toBeInTheDocument();
		expect( getByText( 'Top pages driving sales' ) ).toBeInTheDocument();
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
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const engagementReport = buildEngagementReportOptions( dates );
		const secondaryEventsReport = buildSecondaryEventsReportOptions(
			dates,
			[ ENUM_CONVERSION_EVENTS.ADD_TO_CART ]
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
			getByText( 'Top traffic channels driving sales' )
		).toBeInTheDocument();
		expect( getByText( 'Top pages driving sales' ) ).toBeInTheDocument();
		expect( getByText( 'Sales by visitor type' ) ).toBeInTheDocument();
	} );

	it( 'computes zero rate when sessions count is zero', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
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
			offsetDays: DATE_RANGE_OFFSET,
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
			offsetDays: DATE_RANGE_OFFSET,
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
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );
		const goalDriverDates = registry
			.select( CORE_USER )
			.getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

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
} );
