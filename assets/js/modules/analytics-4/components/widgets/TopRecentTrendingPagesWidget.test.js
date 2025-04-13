/**
 * TopRecentTrendingPagesWidget component tests.
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
	freezeFetch,
	provideKeyMetrics,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
} from '../../../../googlesitekit/datastore/user/constants';
import TopRecentTrendingPagesWidget, {
	getDateRange,
	getReportOptions,
} from './TopRecentTrendingPagesWidget';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../../../../util/errors';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	STRATEGY_ZIP,
} from '../../../analytics-4/utils/data-mock';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { provideCustomDimensionError } from '../../utils/custom-dimensions';

describe( 'TopRecentTrendingPagesWidget', () => {
	let registry;
	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);
	const propertyID = '12345';
	const referenceDate = '2024-05-07';

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4' ) );
		provideUserAuthentication( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]
					.requiredCustomDimensions,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData(
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]
					.requiredCustomDimensions[ 0 ],
				false
			);
	} );

	it( 'should render correctly with the expected metrics', async () => {
		const reportOptions = getReportOptions( referenceDate );
		const pageTitlesReportOptions = {
			...getDateRange( referenceDate ),
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

		provideAnalytics4MockReport( registry, reportOptions );

		const { container, waitForRegistry } = render(
			<TopRecentTrendingPagesWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Freeze the report fetch to keep the widget in loading state.
		freezeFetch( reportEndpoint );

		const { container, waitForRegistry } = render(
			<TopRecentTrendingPagesWidget { ...widgetProps } />,
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
			<TopRecentTrendingPagesWidget { ...widgetProps } />,
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
			<TopRecentTrendingPagesWidget { ...widgetProps } />,
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

	it( 'should render the missing custom dimension error when the required custom dimension is not available', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopRecentTrendingPagesWidget { ...widgetProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();

		expect( getByText( /No data to show/i ) ).toBeInTheDocument();
		expect(
			getByText( /Update Analytics to track metric/i )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the custom dimension error when there is an error creating the custom dimension', async () => {
		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		provideCustomDimensionError( registry, {
			customDimension:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]
					.requiredCustomDimensions[ 0 ],
			error,
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopRecentTrendingPagesWidget { ...widgetProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();

		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
