/**
 * TopDeviceDrivingPurchasesWidget component tests.
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
} from '../../../../../../tests/js/utils';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
} from '../../../../googlesitekit/datastore/user/constants';
import TopDeviceDrivingPurchasesWidget from './TopDeviceDrivingPurchasesWidget';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import {
	DATE_RANGE_OFFSET,
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../../../../util/errors';
import { provideAnalytics4MockReport } from '../../../analytics-4/utils/data-mock';

describe( 'TopDeviceDrivingPurchasesWidget', () => {
	let registry;
	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4' ) );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
	} );

	it( 'should render correctly with the expected metrics', async () => {
		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const reportOptions = [
			{
				...dates,
				metrics: [
					{
						name: 'ecommercePurchases',
					},
				],
			},
			{
				...dates,
				dimensions: [ 'deviceCategory' ],
				metrics: [
					{
						name: 'ecommercePurchases',
					},
				],
				limit: 1,
				orderBy: 'ecommercePurchases',
			},
		];

		reportOptions.forEach( ( options ) =>
			provideAnalytics4MockReport( registry, options )
		);

		const { container, waitForRegistry } = render(
			<TopDeviceDrivingPurchasesWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

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
			<TopDeviceDrivingPurchasesWidget { ...widgetProps } />,
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
			<TopDeviceDrivingPurchasesWidget { ...widgetProps } />,
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
