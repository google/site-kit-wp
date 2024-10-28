/**
 * AudienceSegmentationErrorWidget tests.
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
import {
	render,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideUserInfo,
	fireEvent,
	waitForDefaultTimeouts,
	act,
} from '../../../../../../../../tests/js/test-utils';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../../googlesitekit/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import AudienceSegmentationErrorWidget from '.';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';
import * as tracking from '../../../../../../util/tracking';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceSegmentationErrorWidget', () => {
	let registry;

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
		provideUserInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	const WidgetWithComponentProps = withWidgetComponentProps(
		'audienceSegmentationErrorWidget'
	)( AudienceSegmentationErrorWidget );

	describe( 'default error state', () => {
		let container,
			getByText,
			getByRole,
			queryByText,
			rerender,
			waitForRegistry;

		beforeEach( async () => {
			await registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
				{
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: '',
					},
				},
				'getReport',
				[
					{
						metrics: [
							{
								name: 'totalUsers',
							},
						],
						dimensions: [
							{
								name: 'date',
							},
						],
						startDate: '2020-08-11',
						endDate: '2020-09-07',
					},
				]
			);

			const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

			( {
				container,
				getByText,
				getByRole,
				queryByText,
				rerender,
				waitForRegistry,
			} = render( <WidgetWithComponentProps errors={ errors } />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} ) );

			await waitForRegistry();
		} );

		it( 'should render correctly', () => {
			expect( container ).toMatchSnapshot();

			expect(
				getByText( 'Your visitor groups data loading failed' )
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: /retry/i } )
			).toBeInTheDocument();

			// Verify that it's not an "Insufficient permissions" error.
			expect(
				queryByText( 'Insufficient permissions' )
			).not.toBeInTheDocument();
			expect( queryByText( /request access/i ) ).not.toBeInTheDocument();
		} );

		it( 'should track an event when the widget is viewed', () => {
			const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps errors={ errors } /> );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-all-tiles',
				'data_loading_error'
			);
		} );

		it( 'should track an event when the "Retry" button is clicked', async () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

			// Allow the `trackEvent()` promise to resolve.
			await act( waitForDefaultTimeouts );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-all-tiles',
				'data_loading_error_retry'
			);
		} );
	} );

	describe( 'insufficient permissions error state', () => {
		let container,
			getByText,
			getByRole,
			queryByText,
			rerender,
			waitForRegistry;

		beforeEach( async () => {
			const [ accountID, propertyID, measurementID, webDataStreamID ] = [
				'12345',
				'34567',
				'56789',
				'78901',
			];

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAccountID( accountID );
			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setPropertyID( propertyID );
			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( measurementID );
			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setWebDataStreamID( webDataStreamID );
			await registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
				{
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
					},
				},
				'getAccountID'
			);

			const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

			( {
				container,
				getByText,
				getByRole,
				queryByText,
				rerender,
				waitForRegistry,
			} = render( <WidgetWithComponentProps errors={ errors } />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} ) );

			await waitForRegistry();
		} );
		it( 'should render correctly', () => {
			expect( container ).toMatchSnapshot();

			expect(
				getByText( 'Insufficient permissions' )
			).toBeInTheDocument();

			expect(
				getByText(
					'Contact your administrator. Trouble getting access?'
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: /request access/i } )
			).toBeInTheDocument();

			// Verify that it's not a default error.
			expect(
				queryByText( 'Your visitor groups data loading failed' )
			).not.toBeInTheDocument();
			expect( queryByText( /retry/i ) ).not.toBeInTheDocument();
		} );

		it( 'should track an event when the widget is viewed', () => {
			const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps errors={ errors } /> );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-all-tiles',
				'insufficient_permissions_error'
			);
		} );

		it( 'should track an event when the "Request access" button is clicked', async () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			fireEvent.click(
				getByRole( 'button', { name: /request access/i } )
			);

			// Allow the `trackEvent()` promise to resolve.
			await act( waitForDefaultTimeouts );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-all-tiles',
				'insufficient_permissions_error_request_access'
			);
		} );
	} );

	it( 'should render a retry button when `onRetry` and `showRetryButton` props are passed', async () => {
		await registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
			},
			'getAccountID'
		);

		const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

		const handleRetrySpy = jest.fn();

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WidgetWithComponentProps
				errors={ errors }
				onRetry={ handleRetrySpy }
				showRetryButton
			/>,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText( 'Your visitor groups data loading failed' )
		).toBeInTheDocument();

		expect( getByRole( 'button', { name: /retry/i } ) ).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		expect( handleRetrySpy ).toHaveBeenCalledTimes( 1 );
	} );
} );
