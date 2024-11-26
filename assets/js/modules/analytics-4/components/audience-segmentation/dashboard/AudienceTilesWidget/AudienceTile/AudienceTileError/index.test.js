/**
 * AudienceTileError component tests.
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
import AudienceTileError from '.';
import {
	act,
	fireEvent,
	render,
} from '../../../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
	waitForDefaultTimeouts,
} from '../../../../../../../../../../tests/js/utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../../../../googlesitekit/constants';
import { MODULES_ANALYTICS_4 } from '../../../../../../datastore/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../../../util/errors';
import * as tracking from '../../../../../../../../util/tracking';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceTileError', () => {
	let registry;

	const audienceSlug = 'new-visitors';

	const insufficientPermissionsError = {
		code: 'test_error',
		message: 'Error message.',
		data: {
			status: 403,
			reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
		},
	};

	const notFoundError = {
		code: 404,
		message: 'Not found or permission denied.',
		data: { status: 404, reason: 'notFound' },
	};

	const reportOptions = {
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
		provideSiteInfo( registry );
		provideUserInfo( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
		} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should correctly render the insufficient permissions variant', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( insufficientPermissionsError, 'getReport', [
				reportOptions,
			] );

		const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

		const { container, getByText } = render(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ errors }
			/>,
			{
				registry,
			}
		);

		expect( getByText( 'Insufficient permissions' ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should correctly render the generic error variant', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( notFoundError, 'getReport', [ reportOptions ] );

		const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

		const { container, getByText, waitForRegistry } = render(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ errors }
			/>,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( getByText( 'Data loading failed' ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should track an event when the insufficient permissions error variant is viewed', async () => {
		const { rerender, waitForRegistry } = render(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ [ insufficientPermissionsError ] }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		// Simulate the CTA becoming visible.
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: true,
			intersectionRatio: 1,
		} ) );

		rerender(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ [ insufficientPermissionsError ] }
			/>
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_audiences-tile',
			'insufficient_permissions_error',
			audienceSlug
		);
	} );

	it( 'should track an event when "Request access" is clicked on the insufficient permissions error variant', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( insufficientPermissionsError, 'getReport', [
				reportOptions,
			] );

		const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

		const { getByRole } = render(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ errors }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		await act( async () => {
			fireEvent.click(
				getByRole( 'button', { name: /Request access/ } )
			);

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_audiences-tile',
			'insufficient_permissions_error_request_access',
			audienceSlug
		);
	} );

	it( 'should track an event when the generic error variant is viewed', async () => {
		const { rerender, waitForRegistry } = render(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ [ notFoundError ] }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		// Simulate the CTA becoming visible.
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: true,
			intersectionRatio: 1,
		} ) );

		rerender(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ [ notFoundError ] }
			/>
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_audiences-tile',
			'data_loading_error',
			audienceSlug
		);
	} );

	it( 'should track an event when "Retry" is clicked on the generic error variant', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( notFoundError, 'getReport', [ reportOptions ] );

		const errors = registry.select( MODULES_ANALYTICS_4 ).getErrors();

		const { getByRole } = render(
			<AudienceTileError
				audienceSlug={ audienceSlug }
				errors={ errors }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Retry/ } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_audiences-tile',
			'data_loading_error_retry',
			audienceSlug
		);
	} );
} );
