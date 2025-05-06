/**
 * UserDimensionsPieChart component tests.
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
import { render } from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../../tests/js/utils';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../../tests/js/utils/zeroReports';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { getAnalytics4MockResponse } from '../../../utils/data-mock';
import UserDimensionsPieChart from './UserDimensionsPieChart';

describe( 'UserDimensionsPieChart', () => {
	let registry;

	const reportOptions = {
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		compareStartDate: '2020-11-11',
		compareEndDate: '2020-12-08',
		dimensions: [ 'sessionDefaultChannelGrouping' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
	};
	const analytics4ReportRegexp = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	} );

	it( 'should render the pie chart with data', async () => {
		const report = getAnalytics4MockResponse( reportOptions );

		fetchMock.getOnce( analytics4ReportRegexp, {
			body: report,
		} );

		const { container, waitForRegistry } = render(
			<UserDimensionsPieChart report={ report } loaded />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Verify that the chart is rendered.
		expect(
			container.querySelector(
				'.googlesitekit-widget--analyticsAllTraffic__dimensions-chart'
			)
		).toBeInTheDocument();

		// Verify that the zero data state is not shown.
		expect(
			container.querySelector(
				'.googlesitekit-widget--analyticsAllTraffic__chart-zero-data'
			)
		).not.toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the zero data state when all metrics in the report are zero', async () => {
		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		fetchMock.getOnce( analytics4ReportRegexp, {
			body: zeroReport,
		} );

		const { container, waitForRegistry } = render(
			<UserDimensionsPieChart report={ zeroReport } loaded />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Verify that the zero data state is shown.
		expect(
			container.querySelector(
				'.googlesitekit-widget--analyticsAllTraffic__chart-zero-data'
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the zero data state when the `dataMap` has less than 2 items', async () => {
		// Create a report with no rows.
		const report = getAnalytics4MockResponse( reportOptions );
		const emptyReport = {
			...report,
			rows: [],
			rowCount: 0,
		};

		fetchMock.getOnce( analytics4ReportRegexp, {
			body: emptyReport,
		} );

		const { container, waitForRegistry } = render(
			<UserDimensionsPieChart report={ emptyReport } loaded />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Verify that the zero data state is shown.
		expect(
			container.querySelector(
				'.googlesitekit-widget--analyticsAllTraffic__chart-zero-data'
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
