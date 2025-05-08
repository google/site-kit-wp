/**
 * SearchFunnelWidgetGA4 Chart component tests.
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

import {
	render,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
	provideUserCapabilities,
	provideUserAuthentication,
} from '../../../../../../../tests/js/test-utils';
import {
	withActive,
	withConnected,
} from '../../../../../googlesitekit/modules/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import SearchFunnelWidgetGA4 from '.';
import Chart from './Chart';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../../../../../tests/js/viewport-width-utils';

jest.mock(
	'../../../../../components/GoogleChart',
	() =>
		// Here we provide a mock for the GoogleChart component in order to be able to assert that the chart is rendered
		// for the expected metric. The unmocked component would only render the chart in the loading state, due to the
		// external Google Charts script not being available in the test environment.
		function GoogleChart( { data } ) {
			const metricLabel = data[ 0 ][ 2 ].label;
			return <div id="google-chart-mock">{ metricLabel }</div>;
		}
);

describe( 'SearchFunnelWidgetGA4 Chart', () => {
	let registry;
	let originalViewport;
	let props;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModuleRegistrations( registry );
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		props = {
			canViewSharedAnalytics4: true,
			dateRangeLength: 28,
			ga4StatsData: {},
			ga4VisitorsOverviewAndStatsData: {},
			isGA4GatheringData: false,
			isSearchConsoleGatheringData: false,
			metrics: SearchFunnelWidgetGA4.metrics,
			searchConsoleData: [],
			selectedStats: 0,
			showRecoverableAnalytics: false,
		};

		originalViewport = getViewportWidth();
		setViewportWidth( 450 );
	} );

	afterEach( () => {
		setViewportWidth( originalViewport );
	} );

	describe( 'stats rendering', () => {
		beforeEach( () => {
			provideModules( registry, withConnected( 'analytics-4' ) );
		} );

		it( 'should render Search Console Impressions stats when selectedStats is 0', () => {
			const { container, getByText } = render(
				<Chart { ...props } selectedStats={ 0 } />,
				{
					registry,
				}
			);

			expect(
				container.querySelector(
					'.googlesitekit-search-console-site-stats'
				)
			).toBeInTheDocument();

			expect( getByText( 'Impressions' ) ).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render Search Console Clicks stats when selectedStats is 1', () => {
			const { container, getByText } = render(
				<Chart { ...props } selectedStats={ 1 } />,
				{
					registry,
				}
			);

			expect(
				container.querySelector(
					'.googlesitekit-search-console-site-stats'
				)
			).toBeInTheDocument();

			expect( getByText( 'Clicks' ) ).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render Analytics Unique Visitors stats when selectedStats is 2', () => {
			const { container, getByText } = render(
				<Chart { ...props } selectedStats={ 2 } />,
				{
					registry,
				}
			);

			expect(
				container.querySelector( '.googlesitekit-analytics-site-stats' )
			).toBeInTheDocument();

			expect( getByText( 'Unique Visitors' ) ).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		describe.each( [
			[ 3, 'Conversions' ],
			[ 4, 'Engagement Rate %' ],
		] )( 'when selectedStats is %d', ( selectedStats, metricLabel ) => {
			it( `should render the Analytics ${ metricLabel } stats when canViewSharedAnalytics4 is true`, () => {
				const { container, getByText } = render(
					<Chart { ...props } selectedStats={ selectedStats } />,
					{
						registry,
					}
				);

				expect(
					container.querySelector(
						'.googlesitekit-analytics-site-stats'
					)
				).toBeInTheDocument();

				expect( getByText( metricLabel ) ).toBeInTheDocument();

				expect( container ).toMatchSnapshot();
			} );

			it( `should not render the Analytics ${ metricLabel } stats when canViewSharedAnalytics4 is false`, () => {
				const { container, queryByText } = render(
					<Chart
						{ ...props }
						selectedStats={ selectedStats }
						canViewSharedAnalytics4={ false }
					/>,
					{
						registry,
					}
				);

				expect(
					container.querySelector(
						'.googlesitekit-analytics-site-stats'
					)
				).not.toBeInTheDocument();

				expect( queryByText( metricLabel ) ).not.toBeInTheDocument();
			} );
		} );
	} );

	describe.each( [
		[ 'Set up Google Analytics', false ],
		[ 'Complete setup', true ],
	] )(
		'Activate Analytics CTA with button "%s"',
		( buttonLabel, isGA4Active ) => {
			const analyticsStatus = `not ${
				isGA4Active ? 'connected' : 'active'
			}`;

			beforeEach( () => {
				provideModules(
					registry,
					isGA4Active ? withActive( 'analytics-4' ) : undefined
				);
			} );

			it( `should render the CTA when Analytics is ${ analyticsStatus }`, () => {
				const { container, getByText } = render(
					<Chart { ...props } />,
					{
						registry,
					}
				);

				expect(
					container.querySelector( '.googlesitekit-analytics-cta' )
				).toBeInTheDocument();

				expect( getByText( buttonLabel ) ).toBeInTheDocument();

				expect( container ).toMatchSnapshot();
			} );

			it( `should not render the CTA when Analytics is ${ analyticsStatus } and canViewSharedAnalytics4 is false`, () => {
				const { container, queryByText } = render(
					<Chart { ...props } canViewSharedAnalytics4={ false } />,
					{
						registry,
					}
				);

				expect(
					container.querySelector( '.googlesitekit-analytics-cta' )
				).not.toBeInTheDocument();

				expect( queryByText( buttonLabel ) ).not.toBeInTheDocument();
			} );

			it( `should not render the CTA when Analytics is ${ analyticsStatus } and the breakpoint is not small`, () => {
				setViewportWidth( 601 );

				const { container, queryByText } = render(
					<Chart { ...props } />,
					{
						registry,
					}
				);

				expect(
					container.querySelector( '.googlesitekit-analytics-cta' )
				).not.toBeInTheDocument();

				expect( queryByText( buttonLabel ) ).not.toBeInTheDocument();
			} );
		}
	);
} );
