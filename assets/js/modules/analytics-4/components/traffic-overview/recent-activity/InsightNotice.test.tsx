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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createInsightReport,
	provideInsightReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import {
	createWaitForRegistry,
	freezeFetch,
	provideSiteInfo,
	provideUserAuthentication,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import InsightNotice from './InsightNotice';
import { getInsightReportArgs } from './reportOptions';

// Spy on `get()`, because `cacheTTL` never reaches the network request.
jest.mock( 'googlesitekit-api', () =>
	jest.requireActual( '@tests/js/mock-api-utils' ).mockAPIModuleWithGetSpy()
);

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

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
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
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

	it( 'should render the thumbs in the notice without showing the "Is this section helpful?" question', async () => {
		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );

		const { container, getByRole, queryByText, waitForRegistry } = render(
			<InsightNotice />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__insight-notice-content'
			)
		).toContainElement(
			getByRole( 'group', { name: 'Is this section helpful?' } )
		);
		expect(
			queryByText( 'Is this section helpful?' )
		).not.toBeInTheDocument();
	} );

	it( 'should keep both thumbs in the tab order', async () => {
		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );

		const { getByRole, waitForRegistry } = render( <InsightNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			getByRole( 'button', { name: 'Yes, this was helpful' } ).tabIndex
		).toBe( 0 );
		expect(
			getByRole( 'button', { name: 'No, this was not helpful' } ).tabIndex
		).toBe( 0 );
	} );

	it( 'should trigger the survey and track `vote_up` with no label when "Yes, this was helpful" is clicked', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );

		const { getByRole, waitForRegistry } = render( <InsightNotice />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_recent-activity-survey',
			'vote_up',
			undefined
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID: 'vote:fresh_data_recent_activity_widget:up',
					},
				},
			} )
		);
	} );

	it( 'should trigger the survey and track `vote_down` with no label when "No, this was not helpful" is clicked', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );

		const { getByRole, waitForRegistry } = render( <InsightNotice />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_recent-activity-survey',
			'vote_down',
			undefined
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID:
							'vote:fresh_data_recent_activity_widget:down',
					},
				},
			} )
		);
	} );

	it( 'should keep the clicked thumb selected when the report updates', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );

		const { container, getByRole, waitForRegistry } = render(
			<InsightNotice />,
			{ registry }
		);

		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint )
		);

		act( () => {
			provideInsightReport( registry, 132, [ 100, 100, 100, 100 ] );
		} );

		expect( container ).toHaveTextContent(
			'Your site’s traffic since yesterday is up 32% compared to how it performed at the same time over the past few weeks'
		);
		expect(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
		expect(
			getByRole( 'button', { name: 'No, this was not helpful' } )
		).toHaveAttribute( 'aria-pressed', 'false' );
	} );

	it( 'should track `vote_up` with the category `mainDashboardViewOnly_recent-activity-survey` and not send the `survey-trigger` request when a view-only user clicks "Yes, this was helpful"', async () => {
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );

		provideUserAuthentication( registry, { authenticated: false } );

		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );

		const { getByRole, waitForRegistry } = render( <InsightNotice />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		await waitForRegistry();

		// The `waitForRegistry()` from `render()` has already resolved, so the
		// test needs a new wait for the vote.
		const waitForVote = createWaitForRegistry( registry );

		fireEvent.click(
			getByRole( 'button', { name: 'Yes, this was helpful' } )
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboardViewOnly_recent-activity-survey',
			'vote_up',
			undefined
		);

		await act( waitForVote );

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );

	it( 'should render a placeholder in place of the notice while the report is resolving', () => {
		freezeFetch( reportEndpoint );

		const { container, queryByRole } = render( <InsightNotice />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__insight-notice .googlesitekit-preview-block'
			)
		).toBeInTheDocument();
		expect( container ).not.toHaveTextContent( 'Your site’s traffic' );
		expect(
			queryByRole( 'group', { name: 'Is this section helpful?' } )
		).not.toBeInTheDocument();
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
