/**
 * Recent activity insight notice tests.
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
import { get } from 'googlesitekit-api';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createInsightReport,
	provideInsightReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';
import {
	freezeFetch,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import InsightNotice from './InsightNotice';
import { getInsightReportArgs } from './reportOptions';

// Spy on `get()`, because `cacheTTL` never reaches the network request.
jest.mock( 'googlesitekit-api', () =>
	jest.requireActual( '@tests/js/mock-api-utils' ).mockAPIModuleWithGetSpy()
);

describe( 'InsightNotice', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	// With the reference date set to 2025-02-05, the Recent activity date
	// range runs from 2025-02-03 to 2025-02-05.
	const dateRange = { startDate: '2025-02-03', endDate: '2025-02-05' };

	const reportError = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	it( 'should render the "typical" copy when the visitors are within 25% of the median of the previous four weeks', async () => {
		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );

		const { container, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Your site’s traffic since yesterday is typical compared to how it performed at the same time over the past few weeks'
		);
	} );

	it( 'should render the "up" copy naming the increase when the visitors are more than 25% above the median of the previous four weeks', async () => {
		provideInsightReport( registry, 132, [ 100, 100, 100, 100 ] );

		const { container, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Your site’s traffic since yesterday is up 32% compared to how it performed at the same time over the past few weeks'
		);
	} );

	it( 'should render the "down" copy naming the decrease when the visitors are more than 25% below the median of the previous four weeks', async () => {
		provideInsightReport( registry, 68, [ 100, 100, 100, 100 ] );

		const { container, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Your site’s traffic since yesterday is down 32% compared to how it performed at the same time over the past few weeks'
		);
	} );

	it( 'should render a placeholder in place of the notice while the report is resolving', () => {
		freezeFetch( reportEndpoint );

		const { container } = render( <InsightNotice />, { registry } );

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__insight-notice .googlesitekit-preview-block'
			)
		).toBeInTheDocument();
		expect( container ).not.toHaveTextContent( 'Your site’s traffic' );
	} );

	it( 'should request one report of the total users by date, from the earliest comparison window to the reference date, cached for five minutes', async () => {
		fetchMock.get( reportEndpoint, {
			body: createInsightReport( dateRange, 110, [ 100, 100, 100, 100 ] ),
			status: 200,
		} );

		const { waitForRegistry } = render( <InsightNotice />, { registry } );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint );
		expect( get ).toHaveBeenCalledWith(
			'modules',
			'analytics-4',
			'report',
			expect.objectContaining( {
				startDate: '2025-01-06',
				endDate: '2025-02-05',
				metrics: [ { name: 'totalUsers' } ],
				dimensions: [ { name: 'date' } ],
			} ),
			expect.objectContaining( { cacheTTL: 300 } )
		);
	} );

	it( 'should not request the report when the widget is out of view', async () => {
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );

		render( <InsightNotice />, { registry, inView: false } );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should render nothing when one of the previous four weeks has no visitors', async () => {
		provideInsightReport( registry, 110, [ 100, 100, 100 ] );

		const { container, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when the date range has no visitors', async () => {
		provideInsightReport( registry, 0, [ 100, 100, 100, 100 ] );

		const { container, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when the request for the report fails', async () => {
		fetchMock.get( reportEndpoint, { body: reportError, status: 500 } );

		const { container, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when the report has an error, even when an earlier report is still stored', async () => {
		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( reportError, 'getReport', [
				getInsightReportArgs( dateRange ),
			] );

		const { container, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );
} );
