/**
 * PagesPerVisitWidget component tests.
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
import { getAnalytics4MockResponse } from '../../../analytics-4/utils/data-mock';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_PAGES_PER_VISIT,
} from '../../../../googlesitekit/datastore/user/constants';
import PagesPerVisitWidget from './PagesPerVisitWidget';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '../../../../util/errors';

describe( 'PagesPerVisitWidget', () => {
	let registry;
	const { Widget, WidgetNull } = getWidgetComponentProps(
		KM_ANALYTICS_PAGES_PER_VISIT
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4' ) );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
	} );

	it( 'should render correctly with the expected metrics', async () => {
		const reportOptions = {
			...registry.select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
			metrics: [
				{ name: 'screenPageViewsPerSession' },
				{ name: 'screenPageViews' },
			],
		};

		const report = getAnalytics4MockResponse( reportOptions );
		// Add 1 to the "screenPageViewsPerSession" value which is a TYPE_FLOAT
		// which is set to always be between 0 and 1. Realistically, this value should be
		// greater than 1, since a user views at least one page per session.
		report.rows.forEach( ( row, index, rows ) => {
			rows[ index ].metricValues[ 0 ].value = (
				Number( row.metricValues[ 0 ].value ) + 1
			).toString();
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( report, {
			options: reportOptions,
		} );

		const { container, waitForRegistry } = render(
			<PagesPerVisitWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Freeze the report fetch to keep the widget in loading state.
		freezeFetch( reportEndpoint );

		const { container, waitForRegistry } = render(
			<PagesPerVisitWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
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
			<PagesPerVisitWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
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
			<PagesPerVisitWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
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
