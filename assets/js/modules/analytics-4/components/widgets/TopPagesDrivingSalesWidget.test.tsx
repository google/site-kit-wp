/**
 * TopPagesDrivingSalesWidget component tests.
 *
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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
} from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '@/js/util/errors';
import { render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
	provideUserInfo,
} from '@tests/js/utils';
import TopPagesDrivingSalesWidget from './TopPagesDrivingSalesWidget';

describe( 'TopPagesDrivingSalesWidget', () => {
	let registry: WPDataRegistry;

	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_TOP_PAGES_DRIVING_SALES
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);
	const propertyID = '34567';

	function getReportOptions() {
		return {
			...registry.select( CORE_USER ).getDateRangeDates(),
			dimensions: [ 'pagePath', 'eventName' ],
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
			limit: 6,
			keepEmptyRows: false,
			reportID: 'analytics-4_goal-driver-reports_top-pages',
		};
	}

	/**
	 * Seeds the main report and the page-titles report it triggers, so the
	 * widget can resolve to a fully-loaded, populated state.
	 *
	 * The `/product-c/` page deliberately has no matching page-titles row, to
	 * exercise the fallback to the raw path when no title is available.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function providePopulatedReports() {
		const dates = registry.select( CORE_USER ).getDateRangeDates();
		const reportOptions = getReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				dimensionHeaders: [
					{ name: 'pagePath' },
					{ name: 'eventName' },
				],
				rows: [
					{
						dimensionValues: [
							{ value: '/product-a/' },
							{ value: ENUM_CONVERSION_EVENTS.PURCHASE },
						],
						metricValues: [ { value: '120' } ],
					},
					{
						dimensionValues: [
							{ value: '/product-b/' },
							{ value: ENUM_CONVERSION_EVENTS.PURCHASE },
						],
						metricValues: [ { value: '80' } ],
					},
					{
						dimensionValues: [
							{ value: '/product-c/' },
							{ value: ENUM_CONVERSION_EVENTS.PURCHASE },
						],
						metricValues: [ { value: '40' } ],
					},
				],
			},
			{ options: reportOptions }
		);

		const pageTitlesReportOptions = {
			...dates,
			dimensions: [ 'pagePath', 'pageTitle' ],
			dimensionFilters: {
				pagePath: [ '/product-a/', '/product-b/', '/product-c/' ],
			},
			metrics: [ { name: 'screenPageViews' } ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 15,
			reportID: 'analytics-4_get-page-titles_store:selector_options',
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: '/product-a/' },
							{ value: 'Product A' },
						],
						metricValues: [ { value: '500' } ],
					},
					{
						dimensionValues: [
							{ value: '/product-b/' },
							{ value: 'Product B' },
						],
						metricValues: [ { value: '300' } ],
					},
					// No row for `/product-c/`, so its title resolves to
					// "(unknown)" and the widget falls back to the raw path.
				],
			},
			{ options: pageTitlesReportOptions }
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules(
			registry,
			withConnected( MODULE_SLUG_ANALYTICS_4 ) as Parameters<
				typeof provideModules
			>[ 1 ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Freeze the report fetch to keep the widget in loading state.
		freezeFetch( reportEndpoint );

		const { container, waitForRegistry } = render(
			<TopPagesDrivingSalesWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		[
			'.googlesitekit-km-widget-tile__loading',
			'.googlesitekit-km-widget-tile__loading-header',
			'.googlesitekit-km-widget-tile__loading-body',
		].forEach( ( selector ) => {
			expect( container.querySelector( selector ) ).toBeInTheDocument();
		} );
	} );

	it( 'should render the generic error variant when the report fetch fails', async () => {
		provideModuleRegistrations( registry );

		const errorResponse = {
			code: ERROR_INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			data: { reason: ERROR_INTERNAL_SERVER_ERROR },
		};

		fetchMock.get( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopPagesDrivingSalesWidget { ...widgetProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
	} );

	it( 'should render the insufficient permissions error variant when the report fetch fails', async () => {
		const errorResponse = {
			code: 'test_error',
			message: 'Error message.',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		fetchMock.get( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopPagesDrivingSalesWidget { ...widgetProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();
	} );

	it( 'should render the zero data state when the report has no rows', async () => {
		const reportOptions = getReportOptions();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );

		const { container, getByText, waitForRegistry } = render(
			<TopPagesDrivingSalesWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-table__body-row--no-data' )
		).toBeInTheDocument();
		expect(
			getByText(
				/No data to display: your site hasn’t received any visitors yet/i
			)
		).toBeInTheDocument();
	} );

	it( 'should render each page linked to its GA4 report, with resolved titles and the raw path as a fallback', async () => {
		provideUserInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
		providePopulatedReports();

		const { getByText, getByRole, waitForRegistry } = render(
			<TopPagesDrivingSalesWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// The raw event count is rendered, not a percentage.
		expect( getByText( '120' ) ).toBeInTheDocument();
		expect( getByText( '80' ) ).toBeInTheDocument();
		expect( getByText( '40' ) ).toBeInTheDocument();

		// Resolved titles are rendered as links to the GA4 report.
		expect( getByRole( 'link', { name: /Product A/ } ) ).toHaveAttribute(
			'href'
		);
		expect( getByRole( 'link', { name: /Product B/ } ) ).toHaveAttribute(
			'href'
		);

		// The page with no resolved title falls back to its raw path.
		expect(
			getByRole( 'link', { name: /\/product-c\// } )
		).toBeInTheDocument();
	} );

	it( 'should render plain text labels instead of links on a view-only dashboard', async () => {
		provideUserInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
		providePopulatedReports();

		const { getByText, queryByRole, waitForRegistry } = render(
			<TopPagesDrivingSalesWidget { ...widgetProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);
		await waitForRegistry();

		expect( getByText( 'Product A' ) ).toBeInTheDocument();
		expect( getByText( 'Product B' ) ).toBeInTheDocument();
		expect( queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
