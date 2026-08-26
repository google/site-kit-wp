/**
 * TopAuthorsDrivingSalesWidget component tests.
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
import { KEY_METRICS_WIDGETS } from '@/js/components/KeyMetrics/key-metrics-widgets';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES,
} from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { provideCustomDimensionError } from '@/js/modules/analytics-4/utils/custom-dimensions';
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
	provideUserAuthentication,
} from '@tests/js/utils';
import TopAuthorsDrivingSalesWidget from './TopAuthorsDrivingSalesWidget';

describe( 'TopAuthorsDrivingSalesWidget', () => {
	let registry: WPDataRegistry;

	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);
	const propertyID = '12345';
	const requiredCustomDimensions =
		KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES ]
			.requiredCustomDimensions;

	function getReportOptions() {
		return {
			...registry.select( CORE_USER ).getDateRangeDates(),
			dimensions: [
				'customEvent:googlesitekit_post_author',
				'eventName',
			],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
				},
				'customEvent:googlesitekit_post_author': {
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
			limit: 6,
			keepEmptyRows: false,
			reportID: 'analytics-4_goal-driver-reports_top-authors',
		};
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
		provideUserAuthentication( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: requiredCustomDimensions,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData( {
				customDimension: requiredCustomDimensions[ 0 ],
				gatheringData: false,
			} );
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Freeze the report fetch to keep the widget in loading state.
		freezeFetch( reportEndpoint );

		const { container, waitForRegistry } = render(
			<TopAuthorsDrivingSalesWidget { ...widgetProps } />,
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
			<TopAuthorsDrivingSalesWidget { ...widgetProps } />,
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
			<TopAuthorsDrivingSalesWidget { ...widgetProps } />,
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
			<TopAuthorsDrivingSalesWidget { ...widgetProps } />,
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

	it( "should render each author's share of the total as a percentage", async () => {
		const reportOptions = getReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'Jane Doe' } ],
						metricValues: [ { value: '50' } ],
					},
					{
						dimensionValues: [ { value: 'John Smith' } ],
						metricValues: [ { value: '30' } ],
					},
					{
						dimensionValues: [ { value: 'Alex Lee' } ],
						metricValues: [ { value: '20' } ],
					},
				],
			},
			{ options: reportOptions }
		);

		const { getByText, waitForRegistry } = render(
			<TopAuthorsDrivingSalesWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Jane Doe' ) ).toBeInTheDocument();
		expect( getByText( '50%' ) ).toBeInTheDocument();
		expect( getByText( 'John Smith' ) ).toBeInTheDocument();
		expect( getByText( '30%' ) ).toBeInTheDocument();
		expect( getByText( 'Alex Lee' ) ).toBeInTheDocument();
		expect( getByText( '20%' ) ).toBeInTheDocument();
	} );

	it( 'should render the missing custom dimension error when the required custom dimension is not available', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopAuthorsDrivingSalesWidget { ...widgetProps } />,
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
	} );

	it( 'should render the custom dimension error when there is an error creating the custom dimension', async () => {
		const error = {
			code: 'test-error-code',
			message: 'Test error message',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		provideCustomDimensionError( registry, {
			customDimension: requiredCustomDimensions[ 0 ],
			error,
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopAuthorsDrivingSalesWidget { ...widgetProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();

		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();
	} );
} );
