/**
 * TopEarningContentWidget component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { render } from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideKeyMetrics,
	provideModules,
	freezeFetch,
} from '../../../../../../tests/js/utils';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	STRATEGY_ZIP,
} from '../../../analytics-4/utils/data-mock';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '../../../../googlesitekit/datastore/user/constants';
import TopEarningContentWidget from './TopEarningContentWidget';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import { DATE_RANGE_OFFSET, MODULES_ADSENSE } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../../../../util/errors';

describe( 'TopEarningContentWidget', () => {
	const adSenseAccountID = 'pub-1234567890';

	let registry;
	const { Widget, WidgetNull } = getWidgetComponentProps(
		KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4', 'adsense' ) );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( true );
		registry.dispatch( MODULES_ADSENSE ).setAccountID( adSenseAccountID );
	} );

	it( 'should render correctly with the expected metrics', async () => {
		const pageTitlesReportOptions = {
			...registry
				.select( CORE_USER )
				.getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ),
			dimensionFilters: {
				pagePath: new Array( 3 )
					.fill( '' )
					.map( ( _, i ) => `/test-post-${ i + 1 }/` )
					.sort(),
			},
			dimensions: [ 'pagePath', 'pageTitle' ],
			metrics: [ { name: 'screenPageViews' } ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 15,
		};

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

		provideAnalytics4MockReport( registry, {
			...registry
				.select( CORE_USER )
				.getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ),
			dimensions: [ 'pagePath', 'adSourceName' ],
			metrics: [ { name: 'totalAdRevenue' } ],
			dimensionFilters: {
				adSourceName: `Google AdSense account (${ adSenseAccountID })`,
			},
			orderby: [
				{
					metric: { metricName: 'totalAdRevenue' },
					desc: true,
				},
			],
			limit: 3,
		} );

		const { container, waitForRegistry } = render(
			<TopEarningContentWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Freeze the report fetch to keep the widget in loading state.
		freezeFetch( reportEndpoint );

		const { container, waitForRegistry } = render(
			<TopEarningContentWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
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

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the generic error variant when the report fetch fails', async () => {
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
			<TopEarningContentWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();

		expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
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
			<TopEarningContentWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();

		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
