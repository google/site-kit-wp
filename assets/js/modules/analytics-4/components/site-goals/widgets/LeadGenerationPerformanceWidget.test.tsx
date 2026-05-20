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
import { render } from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
} from '../../../../../../../tests/js/utils';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import {
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import LeadGenerationPerformanceWidget from './LeadGenerationPerformanceWidget';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'LeadGenerationPerformanceWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		'analyticsLeadGenerationPerformance'
	);

	function buildLeadEventsReportOptions(
		dates: Record< string, unknown >,
		leadEvents: string[]
	) {
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

	function buildEngagementReportOptions( dates: Record< string, unknown > ) {
		return {
			...dates,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			reportID: 'analytics-4_site-goals_engagementReportOptions',
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
			reportID: `analytics-4_site-goals_top-traffic-channels_${ GOAL_TYPES.LEAD }`,
		};

		const topTrafficTotalOptions = {
			...dates,
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			reportID: `analytics-4_site-goals_top-traffic-channels-total_${ GOAL_TYPES.LEAD }`,
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
			reportID: `analytics-4_site-goals_top-traffic-channels-rate_${ GOAL_TYPES.LEAD }`,
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
			reportID: `analytics-4_site-goals_top-pages_${ GOAL_TYPES.LEAD }`,
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
			reportID: `analytics-4_site-goals_visitor-type_${ GOAL_TYPES.LEAD }`,
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
			reportID: `analytics-4_site-goals_cities_${ GOAL_TYPES.LEAD }`,
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
			reportID: `analytics-4_site-goals_countries_${ GOAL_TYPES.LEAD }`,
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
										ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
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
								metricValues: [ { value: '37' } ],
							},
							{
								dimensionValues: [ { value: 'New York' } ],
								metricValues: [ { value: '31' } ],
							},
							{
								dimensionValues: [ { value: 'Paris' } ],
								metricValues: [ { value: '19' } ],
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
								metricValues: [ { value: '53' } ],
							},
							{
								dimensionValues: [
									{ value: 'United Kingdom' },
								],
								metricValues: [ { value: '29' } ],
							},
							{
								dimensionValues: [ { value: 'Germany' } ],
								metricValues: [ { value: '16' } ],
							},
					  ],
			},
			{ options: countriesOptions }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ countriesOptions ] );
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

	it( 'renders WidgetNull when no lead events are detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { container, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders WidgetNull when detected events array is empty', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		const { container, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders primary and goal driver sections with a single detected lead event', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { container, getAllByText, getByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
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
		expect( getByText( 'Form completion rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total form completions' ) ).toBeInTheDocument();
		expect( getByText( '"generate_lead" events' ) ).toBeInTheDocument();
		expect(
			getByText( 'What’s helping you reach your goals?' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by total form completions' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by form completion rate' )
		).toBeInTheDocument();
		expect( getByText( 'Leads by visitor type' ) ).toBeInTheDocument();
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
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			getByRole( 'button', {
				name: 'Hide section',
			} )
		).toBeInTheDocument();
	} );

	it( 'aggregates event counts across multiple detected lead events', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.CONTACT,
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
			] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );

		// Provide lead event rows: contact (30) + generate_lead (20) = 50 for date_range_0.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.CONTACT },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '30' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.GENERATE_LEAD },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '20' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.CONTACT },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '25' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.GENERATE_LEAD },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '15' } ],
					},
				],
			},
			{ options: leadEventsReport }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ leadEventsReport ] );

		// Provide engagement report with sessions=200 and engagementRate=0.60.
		// currentSessions = 200 → rate = 50 / 200 = 25% (form completion).
		// Using engagementRate=0.60 (60%) to differentiate from form completion rate (25%).
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				totals: [
					{
						dimensionValues: [ { value: 'date_range_0' } ],
						metricValues: [ { value: '0.60' }, { value: '200' } ],
					},
					{
						dimensionValues: [ { value: 'date_range_1' } ],
						metricValues: [ { value: '0.55' }, { value: '180' } ],
					},
				],
			},
			{ options: engagementReport }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ engagementReport ] );

		const { getByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// currentPrimaryCount = 30 + 20 = 50, currentSessions = 200 → rate = 25%.
		expect( getByText( '25%' ) ).toBeInTheDocument();
		// Total form completions tile shows currentPrimaryCount = 50.
		expect( getByText( '50' ) ).toBeInTheDocument();
		expect(
			getByText( 'What’s helping you reach your goals?' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by total form completions' )
		).toBeInTheDocument();
		expect(
			getByText( 'Top traffic channels by form completion rate' )
		).toBeInTheDocument();
		expect( getByText( 'Leads by visitor type' ) ).toBeInTheDocument();
	} );

	it( 'computes zero rate when sessions count is zero', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM ], {
			empty: true,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [] }, { options: leadEventsReport } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ leadEventsReport ] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { totals: [] }, { options: engagementReport } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ engagementReport ] );

		const { getAllByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getAllByText( '0%' ).length ).toBeGreaterThanOrEqual( 1 );
		expect(
			getAllByText( /No data to display: .* any leads yet/i ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'renders loading state while reports are being resolved', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ], {
			loading: true,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ leadEventsReport ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ engagementReport ] );

		const { container, unmount } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
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
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ], {
			loading: true,
		} );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { container, unmount, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
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
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );
		const goalDriverDates = registry
			.select( CORE_USER )
			.getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const goalDriverReportOptions = {
			...goalDriverDates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
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
			reportID: `analytics-4_site-goals_top-traffic-channels_${ GOAL_TYPES.LEAD }`,
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
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
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
