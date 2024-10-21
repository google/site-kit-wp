/**
 * AudienceTile component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import AudienceTile from '.';
import {
	act,
	fireEvent,
	render,
} from '../../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	waitForDefaultTimeouts,
} from '../../../../../../../../../tests/js/utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../../../googlesitekit/constants';
import { CORE_SITE } from '../../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../../../googlesitekit/widgets/util';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../../util/errors';
import * as tracking from '../../../../../../../util/tracking';
import {
	MODULES_ANALYTICS_4,
	DATE_RANGE_OFFSET,
} from '../../../../../datastore/constants';
import { provideCustomDimensionError } from '../../../../../utils/custom-dimensions';
import { getAnalytics4MockResponse } from '../../../../../utils/data-mock';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceTile', () => {
	let registry;

	const WidgetWithComponentProps =
		withWidgetComponentProps( 'audienceTile' )( AudienceTile );

	const audienceResourceName = 'properties/12345/audiences/12345';
	const props = {
		audienceResourceName,
		title: 'New visitors',
		toolTip: 'This is a tooltip',
		loaded: true,
		visitors: {
			metricValue: 24200,
			currentValue: 24200,
			previousValue: 20424,
		},
		visitsPerVisitor: {
			metricValue: 3,
			currentValue: 3,
			previousValue: 2,
		},
		pagesPerVisit: {
			metricValue: 2,
			currentValue: 2,
			previousValue: 3,
		},
		pageviews: {
			metricValue: 1565,
			currentValue: 1565,
			previousValue: 1504,
		},
		percentageOfTotalPageViews: 0.333,
		topCities: {
			dimensionValues: [
				{
					value: 'Dublin',
				},
				{
					value: 'London',
				},
				{
					value: 'New York',
				},
			],
			metricValues: [
				{
					value: 0.388,
				},
				{
					value: 0.126,
				},
				{
					value: 0.094,
				},
			],
			total: 0.608,
		},
		topContent: {
			dimensionValues: [
				{
					value: '/en/test-post-1/',
				},
				{
					value: '/en/test-post-2/',
				},
				{
					value: '/en/test-post-3/',
				},
			],
			metricValues: [
				{
					value: 847,
				},
				{
					value: 596,
				},
				{
					value: 325,
				},
			],
			total: 1768,
		},
		topContentTitles: {
			'/en/test-post-1/': 'Test Post 1',
		},
		isZeroData: false,
		isPartialData: false,
	};

	beforeEach( () => {
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: false,
			intersectionRatio: 0,
		} ) );

		registry = createTestRegistry();
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableCustomDimensions: [],
			availableAudiencesLastSyncedAt: ( Date.now() - 1000 ) / 1000,
		} );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const options = {
			...dates,
			dimensions: [ 'date' ],
			metrics: [
				{
					name: 'totalUsers',
				},
			],
		};
		const reportData = getAnalytics4MockResponse( options );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( reportData, {
			options,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					[ audienceResourceName ]: 20201220,
				},
				customDimension: {},
				property: {},
			} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should render the AudienceTile component', () => {
		const { container } = render(
			<WidgetWithComponentProps { ...props } />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();
	} );

	describe( 'Top content metric', () => {
		it( 'should track an event when the create custom dimension CTA is viewed', () => {
			const { getByRole, rerender } = render(
				<WidgetWithComponentProps { ...props } />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect(
				getByRole( 'button', { name: /update/i } )
			).toBeInTheDocument();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps { ...props } /> );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-top-content-cta',
				'view_cta'
			);
		} );

		it( 'should track an event when the create custom dimension CTA is clicked', async () => {
			const { getByRole } = render(
				<WidgetWithComponentProps { ...props } />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /update/i } ) );

				// Allow the `trackEvent()` promise to resolve.
				await waitForDefaultTimeouts();
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-top-content-cta',
				'create_custom_dimension'
			);
		} );
	} );

	describe( 'AudienceErrorModal', () => {
		it( 'should show the OAuth error modal when the required scopes are not granted', async () => {
			provideSiteInfo( registry, {
				setupErrorCode: 'access_denied',
			} );

			provideUserAuthentication( registry, {
				grantedScopes: [],
			} );

			const { getByRole, getByText } = render(
				<WidgetWithComponentProps { ...props } />,
				{
					registry,
				}
			);

			expect(
				getByRole( 'button', { name: /update/i } )
			).toBeInTheDocument();

			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /update/i } ) );

				// Allow the `trackEvent()` promise to resolve so the custom dimension creation logic can be executed.
				await waitForDefaultTimeouts();
			} );

			// Verify the error is an OAuth error variant.
			expect(
				getByText( /Analytics update failed/i )
			).toBeInTheDocument();

			// Verify the "Get help" link is displayed.
			expect( getByText( /get help/i ) ).toBeInTheDocument();

			expect(
				getByRole( 'link', { name: /get help/i } )
			).toHaveAttribute(
				'href',
				registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
					code: 'access_denied',
				} )
			);

			// Verify the "Retry" button is displayed.
			expect( getByText( /retry/i ) ).toBeInTheDocument();
		} );

		it( 'should show the insufficient permission error modal when the user does not have the required permissions', async () => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			};

			provideCustomDimensionError( registry, {
				customDimension: 'googlesitekit_post_type',
				error,
			} );

			const { getByRole, getByText } = render(
				<WidgetWithComponentProps { ...props } />,
				{
					registry,
				}
			);

			expect(
				getByRole( 'button', { name: /update/i } )
			).toBeInTheDocument();

			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /update/i } ) );

				// Allow the `trackEvent()` promise to resolve so the custom dimension creation logic can be executed.
				await waitForDefaultTimeouts();
			} );

			// Verify the error is "Insufficient permissions" variant.
			expect(
				getByText( /Insufficient permissions/i )
			).toBeInTheDocument();

			// Verify the "Get help" link is displayed.
			expect( getByText( /get help/i ) ).toBeInTheDocument();

			// Verify the "Request access" button is displayed.
			expect( getByText( /request access/i ) ).toBeInTheDocument();
		} );

		it( 'should show the generic error modal when an internal server error occurs', async () => {
			const error = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			provideCustomDimensionError( registry, {
				customDimension: 'googlesitekit_post_type',
				error,
			} );

			const { getByRole, getByText } = render(
				<WidgetWithComponentProps { ...props } />,
				{
					registry,
				}
			);

			expect(
				getByRole( 'button', { name: /update/i } )
			).toBeInTheDocument();

			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /update/i } ) );

				// Allow the `trackEvent()` promise to resolve so the custom dimension creation logic can be executed.
				await waitForDefaultTimeouts();
			} );

			// Verify the error is a generic error variant.
			expect(
				getByText( /Failed to enable metric/i )
			).toBeInTheDocument();

			// Verify the "Retry" button is displayed.
			expect(
				getByRole( 'button', { name: /retry/i } )
			).toBeInTheDocument();
		} );
	} );
} );
