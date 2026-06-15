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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { setItem } from '@/js/googlesitekit/api/cache';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	BREAKDOWN_ORIGIN_FORM_KEY,
	BREAKDOWN_ORIGIN_WIDGET,
	BREAKDOWN_SCOPE_FORM_KEY,
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { AVAILABILITY_SYNC_CACHE_KEY } from '@/js/modules/analytics-4/components/site-goals/notifications/BreakdownNoticeArea';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	DATE_RANGE_OFFSET,
	ENUM_CONVERSION_EVENTS,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { getPreviousDate } from '@/js/util';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { provideUserCapabilities } from '@tests/js/utils';
import { surveyTriggerEndpoint } from '../../../../../../../tests/js/mock-survey-endpoints';
import LeadGenerationPerformanceWidget from './LeadGenerationPerformanceWidget';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'LeadGenerationPerformanceWidget', () => {
	let registry: WPDataRegistry;

	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		'analyticsLeadGenerationPerformance'
	);

	function buildLeadEventsReportOptions(
		dates: Record< string, unknown >,
		leadEvents: string[],
		breakdownFilter: Record< string, unknown > = {}
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
				...breakdownFilter,
			},
			reportID:
				'analytics-4_lead-generation-performance-widget_widget_leadEventsReportOptions',
		};
	}

	function buildEngagementReportOptions(
		dates: Record< string, unknown >,
		breakdownFilter?: Record< string, unknown >
	) {
		return {
			...dates,
			metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
			...( breakdownFilter ? { dimensionFilters: breakdownFilter } : {} ),
			reportID: 'analytics-4_site-goals_engagementReportOptions',
		};
	}

	// A metrics-only compare report whose totals carry one row per date range.
	function buildTotals( count: number ) {
		return {
			totals: [
				{
					dimensionValues: [ { value: 'date_range_0' } ],
					metricValues: [ { value: String( count ) } ],
				},
				{
					dimensionValues: [ { value: 'date_range_1' } ],
					metricValues: [ { value: '0' } ],
				},
			],
		};
	}

	function seedGoalDriverReports(
		eventNames: string[],
		{
			empty = false,
			loading = false,
			breakdownFilter = {},
		}: {
			empty?: boolean;
			loading?: boolean;
			breakdownFilter?: Record< string, unknown >;
		} = {}
	) {
		const dates = registry.select( CORE_USER ).getDateRangeDates();

		const dimensionFilters = {
			eventName: {
				filterType: 'inListFilter',
				value: eventNames,
			},
			...breakdownFilter,
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

	const FORM_DIMENSION = 'customEvent:googlesitekit_form_id';
	const formMetadataEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/form-metadata'
	);

	// Seeds the breakdown discovery report (which form tabs to show) plus the
	// partial-data state, so the breakdown selectors resolve without network.
	// Empty `formIDs` keeps the widget in aggregated mode (no tabs).
	function seedBreakdown( {
		formIDs = [],
		availabilityDate,
		hasOtherSources = true,
		formPages = {},
	}: {
		formIDs?: string[];
		availabilityDate?: number;
		hasOtherSources?: boolean;
		formPages?: Record< string, string[] >;
	} = {} ) {
		// The tab structure is evaluated over the fixed 90-day discovery window.
		const referenceDate = registry.select( CORE_USER ).getReferenceDate();
		const discoveryDates = {
			startDate: getPreviousDate( referenceDate, 90 ),
			endDate: referenceDate,
		};
		const options = {
			...discoveryDates,
			dimensions: [ FORM_DIMENSION ],
			dimensionFilters: {
				[ FORM_DIMENSION ]: {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
			reportID:
				'analytics-4_site-goals-breakdown_values_googlesitekit_form_id',
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: formIDs.map( ( value, index ) => ( {
					dimensionValues: [ { value } ],
					metricValues: [ { value: String( 100 - index ) } ],
				} ) ),
			},
			{ options }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );

		function buildOtherSourcesOptions(
			optionDates: Record< string, string >,
			kind: string
		) {
			return {
				...optionDates,
				metrics: [ { name: 'eventCount' } ],
				dimensionFilters: {
					eventName: {
						filterType: 'inListFilter',
						value: [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
					},
					...( 'attributed' === kind
						? {
								[ FORM_DIMENSION ]: {
									filterType: 'inListFilter',
									value: formIDs,
								},
						  }
						: {} ),
				},
				reportID: `analytics-4_site-goals-breakdown_other-sources-${ kind }_googlesitekit_form_id`,
			};
		}

		function seedReport(
			reportOptions: Record< string, unknown >,
			report: unknown
		) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( report, { options: reportOptions } );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ reportOptions ] );
		}

		// "Other sources" = all lead-event count − the count attributed to a
		// form. Existence is decided over the discovery window; the displayed
		// count over the current compare range. When hasOtherSources, all (100)
		// exceeds attributed (90) by 10. Only queried once there are tabs.
		if ( formIDs.length ) {
			const allCount = hasOtherSources ? 100 : 90;

			// Existence over the discovery window (single-range totals).
			seedReport( buildOtherSourcesOptions( discoveryDates, 'all' ), {
				totals: [ { metricValues: [ { value: String( allCount ) } ] } ],
			} );
			seedReport(
				buildOtherSourcesOptions( discoveryDates, 'attributed' ),
				{ totals: [ { metricValues: [ { value: '90' } ] } ] }
			);

			// Displayed count over the current compare range.
			const compareDates = registry
				.select( CORE_USER )
				.getDateRangeDates( { compare: true } );
			seedReport(
				buildOtherSourcesOptions( compareDates, 'all' ),
				buildTotals( allCount )
			);
			seedReport(
				buildOtherSourcesOptions( compareDates, 'attributed' ),
				buildTotals( 90 )
			);

			// The per-form "pages" report drives the tab tooltip variant.
			const formPagesOptions = {
				...discoveryDates,
				dimensions: [ FORM_DIMENSION, 'pagePath' ],
				dimensionFilters: {
					[ FORM_DIMENSION ]: {
						filterType: 'inListFilter',
						value: formIDs,
					},
				},
				metrics: [ { name: 'eventCount' } ],
				orderby: [
					{ metric: { metricName: 'eventCount' }, desc: true },
				],
				reportID:
					'analytics-4_site-goals-breakdown_form-pages_googlesitekit_form_id',
			};
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				{
					rows: Object.entries( formPages ).flatMap(
						( [ formID, pagePaths ] ) =>
							pagePaths.map( ( pagePath, index ) => ( {
								dimensionValues: [
									{ value: formID },
									{ value: pagePath },
								],
								metricValues: [
									{ value: String( 100 - index ) },
								],
							} ) )
					),
				},
				{ options: formPagesOptions }
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ formPagesOptions ] );
		}

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			resourceAvailabilityDates: availabilityDate
				? {
						customDimension: {
							googlesitekit_form_id: availabilityDate,
						},
				  }
				: {},
		} );
	}

	beforeEach( async () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		// Mark the breakdown notice's throttled availability sync as already done,
		// so it doesn't schedule a background sync during these tests.
		await setItem( AVAILABILITY_SYNC_CACHE_KEY, true );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { availableCustomDimensions: [] } );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSiteGoalsSettings( {} );
		// Default to the breakdown notice being hidden (intro modal not yet
		// dismissed); individual tests opt in by dismissing the intro modal.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		// Default to aggregated mode (no breakdown form values yet); tabbed tests
		// re-seed with form IDs.
		seedBreakdown();
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

	it( 'renders the breakdown notice in the aggregated state and shows the tooltip on dismiss', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		// Aggregated state: intro modal dismissed, breakdown dimensions not yet
		// created (availableCustomDimensions seeded as [] in beforeEach).
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ SITE_GOALS_INTRO_MODAL_BANNER ] );
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{ body: [], status: 200 }
		);

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

		const { getByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			getByText( 'Want to see results for each form?' )
		).toBeInTheDocument();

		fireEvent.click( getByText( 'No thanks' ) );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( 'admin-screen-tooltip' )
			).toMatchObject( { isTooltipVisible: true } );
		} );
	} );

	it( 'renders primary and goal driver sections with a single detected lead event', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
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
		).toHaveLength( 3 ); // Form completion rate + Total form completions + Engagement rate
		expect( getByText( 'Form completion rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total form completions' ) ).toBeInTheDocument();
		expect( getByText( '“generate_lead” events' ) ).toBeInTheDocument();
		expect( getByText( 'Engagement rate' ) ).toBeInTheDocument();
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
			compare: true,
		} );
		const goalDriverDates = registry
			.select( CORE_USER )
			.getDateRangeDates();

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

	it( 'renders engagement rate tile with compare values', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Engagement rate' ) ).toBeInTheDocument();
		expect(
			getByText( 'How are your visitors engaging?' )
		).toBeInTheDocument();
	} );

	it( 'does not render secondary ecommerce tiles', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { queryByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// No secondary ecommerce tiles should appear in lead generation widget.
		expect( queryByText( 'Total Sales' ) ).not.toBeInTheDocument();
		expect(
			queryByText( 'Products added to cart' )
		).not.toBeInTheDocument();
		expect(
			queryByText( 'Products added to cart' )
		).not.toBeInTheDocument();
	} );

	it( 'dispatches an up vote on thumbs-up click', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.CONTACT,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
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
						triggerID: 'vote:site_goals_widget_lead_generation:up',
					},
				},
			} )
		);
	} );

	it( 'dispatches a down vote on thumbs-down click', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		const leadEventsReport = buildLeadEventsReportOptions( dates, [
			ENUM_CONVERSION_EVENTS.CONTACT,
		] );
		const engagementReport = buildEngagementReportOptions( dates );
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		provideAnalytics4MockReport( registry, leadEventsReport );
		provideAnalytics4MockReport( registry, engagementReport );

		const { getByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
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
						triggerID:
							'vote:site_goals_widget_lead_generation:down',
					},
				},
			} )
		);
	} );

	function seedReadyReports() {
		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} );

		provideAnalytics4MockReport(
			registry,
			buildLeadEventsReportOptions( dates, [
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
			] )
		);
		provideAnalytics4MockReport(
			registry,
			buildEngagementReportOptions( dates )
		);
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
	}

	function seedBreakdownDimensions( gatheringData: boolean ) {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
		} );
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS.forEach( ( customDimension ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsCustomDimensionGatheringData( {
					customDimension,
					gatheringData,
				} );
		} );
	}

	it( 'renders the gathering breakdown data badge when the dimensions are gathering data', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedReadyReports();
		seedBreakdownDimensions( true );

		const { getByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Gathering breakdown data' ) ).toBeInTheDocument();
	} );

	it( 'does not render the gathering breakdown data badge when the dimensions have data available', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedReadyReports();
		seedBreakdownDimensions( false );

		const { queryByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			queryByText( 'Gathering breakdown data' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the gathering breakdown data badge alongside the breakdown success notice', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedReadyReports();
		seedBreakdownDimensions( true );

		// Mark this widget as the instance that just enabled the breakdown so the
		// success notice from #12801 renders.
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_WIDGET,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );

		const { getByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Gathering breakdown data' ) ).toBeInTheDocument();
		expect(
			getByText( /Individual form tracking is now active/i )
		).toBeInTheDocument();
	} );

	// Seeds the Key action, engagement and goal driver reports for a breakdown
	// tab whose section reports carry the given form filter.
	function seedTabbedReports( breakdownFilter: Record< string, unknown > ) {
		const dates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );

		provideAnalytics4MockReport(
			registry,
			buildLeadEventsReportOptions(
				dates,
				[ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
				breakdownFilter
			)
		);
		provideAnalytics4MockReport(
			registry,
			buildEngagementReportOptions( dates, breakdownFilter )
		);
		seedGoalDriverReports( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ], {
			breakdownFilter,
		} );
	}

	it( 'does not render breakdown tabs in aggregated mode (no form values)', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		// beforeEach seeds an empty breakdown discovery report (no form values).
		seedReadyReports();

		const { queryByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// An empty value set must not render a lone "Other sources" tab.
		expect( queryByRole( 'tab' ) ).not.toBeInTheDocument();
	} );

	it( 'renders form tabs with resolved titles and a Form #id fallback', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedBreakdown( { formIDs: [ '5', '12' ] } );
		fetchMock.getOnce( formMetadataEndpoint, {
			body: {
				5: { title: 'Contact', plugin: 'WPForms' },
				12: { title: null, plugin: null },
			},
			status: 200,
		} );
		// The first form tab is active by default.
		seedTabbedReports( { [ FORM_DIMENSION ]: '5' } );

		const { getByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByRole( 'tab', { name: /Contact/ } ) ).toBeInTheDocument();
		expect( getByRole( 'tab', { name: 'Form #12' } ) ).toBeInTheDocument();
		expect(
			getByRole( 'tab', { name: 'Other form completions' } )
		).toBeInTheDocument();
	} );

	it( 'renders an info tooltip for a form tab whose plugin is known, across page-count variants', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		// Form 5 appears on multiple pages (the "as an example" variant); form 12
		// has no known plugin, so it gets no tooltip.
		seedBreakdown( {
			formIDs: [ '5', '12' ],
			formPages: { 5: [ '/contact', '/about' ] },
		} );
		fetchMock.getOnce( formMetadataEndpoint, {
			body: {
				5: { title: 'Contact', plugin: 'WPForms' },
				12: { title: 'Quote', plugin: null },
			},
			status: 200,
		} );
		seedTabbedReports( { [ FORM_DIMENSION ]: '5' } );

		const { container, getByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByRole( 'tab', { name: /Contact/ } ) ).toBeInTheDocument();
		// Only the form with a known plugin gets an info tooltip within the tabs
		// (the Key action tiles have their own tooltips, so scope to the tab bar).
		const tabs = container.querySelector(
			'.googlesitekit-site-goals-breakdown-tabs'
		);
		expect(
			tabs?.querySelectorAll( '.googlesitekit-info-tooltip' )
		).toHaveLength( 1 );
	} );

	it( 'renders tabs only after form titles resolve', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedBreakdown( { formIDs: [ '5' ] } );
		fetchMock.getOnce( formMetadataEndpoint, {
			body: { 5: { title: 'Contact', plugin: null } },
			status: 200,
		} );
		seedTabbedReports( { [ FORM_DIMENSION ]: '5' } );

		const { getByRole, queryByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);

		// Titles aren't resolved on first render, so tabs are withheld.
		expect( queryByRole( 'tab' ) ).not.toBeInTheDocument();

		await waitForRegistry();

		// Once both the values and titles resolve, the tabs render.
		expect( getByRole( 'tab', { name: /Contact/ } ) ).toBeInTheDocument();
	} );

	it( 'renders the partial data badge on each section in the tabbed view', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedBreakdown( { formIDs: [ '5' ], availabilityDate: 20260519 } );
		fetchMock.getOnce( formMetadataEndpoint, {
			body: { 5: { title: 'Contact', plugin: 'WPForms' } },
			status: 200,
		} );
		seedTabbedReports( { [ FORM_DIMENSION ]: '5' } );

		const { getAllByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getAllByText( 'Partial data' ).length ).toBeGreaterThanOrEqual(
			3
		);
	} );

	it( 'renders only the Key action on the Other sources tab', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedBreakdown( { formIDs: [ '5' ] } );
		fetchMock.getOnce( formMetadataEndpoint, {
			body: { 5: { title: 'Contact', plugin: 'WPForms' } },
			status: 200,
		} );
		seedTabbedReports( { [ FORM_DIMENSION ]: '5' } );
		// The Other sources tab applies no section filter (its single metric comes
		// from the breakdown report), so it falls back to the unfiltered reports.
		const otherTabDates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );
		provideAnalytics4MockReport(
			registry,
			buildLeadEventsReportOptions( otherTabDates, [
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
			] )
		);
		provideAnalytics4MockReport(
			registry,
			buildEngagementReportOptions( otherTabDates )
		);

		const { getByRole, getByText, queryByText, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// The lead "Other sources" tab uses a goal-specific label.
		fireEvent.click(
			getByRole( 'tab', { name: 'Other form completions' } )
		);

		await waitFor( () => {
			expect( getByText( 'Key action' ) ).toBeInTheDocument();
		} );
		// Only the aggregate total renders — no rate tile, engagement or drivers.
		expect( getByText( 'Total form completions' ) ).toBeInTheDocument();
		expect( queryByText( 'Form completion rate' ) ).not.toBeInTheDocument();
		expect(
			queryByText( 'How are your visitors engaging?' )
		).not.toBeInTheDocument();
		expect(
			queryByText( 'What’s helping you reach your goals?' )
		).not.toBeInTheDocument();
		// The explanatory notice is shown.
		expect(
			getByText( /Site Kit doesn’t track additional data/i )
		).toBeInTheDocument();
	} );

	it( 'does not render an Other sources tab when there is no unattributed data', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ] );
		seedBreakdown( { formIDs: [ '5' ], hasOtherSources: false } );
		fetchMock.getOnce( formMetadataEndpoint, {
			body: { 5: { title: 'Contact', plugin: 'WPForms' } },
			status: 200,
		} );
		seedTabbedReports( { [ FORM_DIMENSION ]: '5' } );

		const { getByRole, queryByRole, waitForRegistry } = render(
			<LeadGenerationPerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByRole( 'tab', { name: /Contact/ } ) ).toBeInTheDocument();
		expect(
			queryByRole( 'tab', { name: 'Other form completions' } )
		).not.toBeInTheDocument();
	} );
} );
