/**
 * TopTrafficSourceWidget component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	act,
	fireEvent,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../utils/data-mock';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
} from '../../../../googlesitekit/datastore/user/constants';
import TopTrafficSourceWidget from './TopTrafficSourceWidget';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../../../../util/errors';

describe( 'TopTrafficSourceWidget', () => {
	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	let registry;
	let dateRangeDates;
	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		dateRangeDates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4' ) );
	} );

	it( 'should render correctly with the expected metrics', async () => {
		provideAnalytics4MockReport( registry, {
			...dateRangeDates,
			dimensions: [ 'sessionDefaultChannelGroup' ],
			metrics: [
				{
					name: 'totalUsers',
				},
			],
			limit: 1,
			orderBy: 'totalUsers',
		} );
		provideAnalytics4MockReport( registry, {
			...dateRangeDates,
			metrics: [
				{
					name: 'totalUsers',
				},
			],
		} );
		const { container, waitForRegistry } = render(
			<TopTrafficSourceWidget { ...widgetProps } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should retry both reports when an error is encountered', async () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/report.*sessionDefaultChannelGroup.*'
			),
			{
				body: {
					code: 'invalid_json',
					message: 'whatever',
					data: {},
				},
				status: 500,
			}
		);
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/report((?!sessionDefaultChannelGroup).)*'
			),
			{
				body: {
					code: 'invalid_json',
					message: 'whatever',
					data: {},
				},
				status: 500,
			}
		);

		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		const { container, getByText, waitForRegistry } = render(
			<TopTrafficSourceWidget { ...widgetProps } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( fetchMock ).toHaveFetchedTimes( 2 );
		expect( container ).toMatchSnapshot();

		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/report.*sessionDefaultChannelGroup.*'
			),
			{
				body: getAnalytics4MockResponse( {
					...dateRangeDates,
					dimensions: [ 'sessionDefaultChannelGroup' ],
					metrics: [
						{
							name: 'totalUsers',
						},
					],
					limit: 1,
					orderBy: 'totalUsers',
				} ),
				status: 200,
			}
		);

		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/report((?!sessionDefaultChannelGroup).)*'
			),
			{
				body: getAnalytics4MockResponse( {
					...dateRangeDates,
					metrics: [
						{
							name: 'totalUsers',
						},
					],
				} ),
				status: 200,
			}
		);

		await waitForRegistry();

		act( () => {
			fireEvent.click( getByText( 'Retry' ) );
		} );

		await waitFor( () => {
			expect(
				document.querySelector(
					'.googlesitekit-km-widget-tile__metric'
				)
			).toBeInTheDocument();
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
			<TopTrafficSourceWidget { ...widgetProps } />,
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
			<TopTrafficSourceWidget { ...widgetProps } />,
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
