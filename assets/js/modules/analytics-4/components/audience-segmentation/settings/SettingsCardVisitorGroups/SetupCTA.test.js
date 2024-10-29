/**
 * SettingsCardVisitorGroups SetupCTA component tests.
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
 * Internal dependencies
 */
import { availableAudiences as audiencesFixture } from '../../../../datastore/__fixtures__';
import {
	act,
	createTestRegistry,
	fireEvent,
	freezeFetch,
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	untilResolved,
	waitFor,
	waitForDefaultTimeouts,
} from '../../../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import SetupCTA from './SetupCTA';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';

describe( 'SettingsCardVisitorGroups SetupCTA', () => {
	let registry;

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);
	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableAudiences: null,
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
			propertyID: '123456789',
		} );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render the setup CTA', () => {
		const { getByText, getByRole } = render( <SetupCTA />, { registry } );

		expect(
			getByText(
				'To set up new visitor groups for your site, Site Kit needs to update your Google Analytics property.'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /Enable groups/i } )
		).toBeInTheDocument();
	} );

	it( 'should show in progress state when enabling groups', async () => {
		freezeFetch( syncAvailableAudiencesEndpoint );

		const { getByText, getByRole } = render( <SetupCTA />, { registry } );

		fireEvent.click( getByRole( 'button', { name: /Enable groups/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		expect( getByText( 'Enabling groups' ) ).toBeInTheDocument();
	} );

	it( 'should initialize the list of configured audiences when the CTA is clicked', async () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		freezeFetch( audienceSettingsEndpoint );
		muteFetch( reportEndpoint );

		const { getByText, getByRole } = render( <SetupCTA />, { registry } );

		expect(
			getByRole( 'button', { name: /Enable groups/i } )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /Enable groups/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		expect( getByText( 'Enabling groups' ) ).toBeInTheDocument();

		await act(
			async () =>
				await untilResolved( registry, CORE_USER ).getAudienceSettings()
		);

		expect( fetchMock ).toHaveFetched( syncAvailableAudiencesEndpoint );

		await act( waitForDefaultTimeouts );
	} );

	describe( 'AudienceErrorModal', () => {
		it( 'should show the OAuth error modal when the required scopes are not granted', async () => {
			provideSiteInfo( registry, {
				setupErrorCode: 'access_denied',
			} );

			provideUserAuthentication( registry, {
				grantedScopes: [],
			} );

			const settings = {
				configuredAudiences: [],
				isAudienceSegmentationWidgetHidden: false,
			};

			// Set the data availability on page load to true.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsDataAvailableOnLoad( true );

			registry
				.dispatch( CORE_USER )
				.receiveGetAudienceSettings( settings );

			const { getByRole, getByText } = render( <SetupCTA />, {
				registry,
			} );

			expect(
				getByRole( 'button', { name: /Enable groups/i } )
			).toBeInTheDocument();

			act( () => {
				fireEvent.click(
					getByRole( 'button', { name: /Enable groups/i } )
				);
			} );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

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
			const errorResponse = {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			};

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				body: errorResponse,
				status: 500,
			} );

			const { getByRole, getByText } = render( <SetupCTA />, {
				registry,
			} );

			expect(
				getByRole( 'button', { name: /Enable groups/i } )
			).toBeInTheDocument();

			act( () => {
				fireEvent.click(
					getByRole( 'button', { name: /Enable groups/i } )
				);
			} );

			// Verify the error is "Insufficient permissions" variant.
			await waitFor( () => {
				expect(
					getByText( /Insufficient permissions/i )
				).toBeInTheDocument();

				// Verify the "Get help" link is displayed.
				expect( getByText( /get help/i ) ).toBeInTheDocument();

				// Verify the "Request access" button is displayed.
				expect( getByText( /request access/i ) ).toBeInTheDocument();
			} );
		} );

		it( 'should show the generic error modal when an internal server error occurs', async () => {
			const errorResponse = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				body: errorResponse,
				status: 500,
			} );

			const { getByRole, getByText } = render( <SetupCTA />, {
				registry,
			} );

			expect(
				getByRole( 'button', { name: /Enable groups/i } )
			).toBeInTheDocument();

			act( () => {
				fireEvent.click(
					getByRole( 'button', { name: /Enable groups/i } )
				);
			} );

			// Verify the error is general error variant.
			await waitFor( () => {
				expect(
					getByText( /Failed to set up visitor groups/i )
				).toBeInTheDocument();

				// Verify the "Retry" button is displayed.
				expect(
					getByRole( 'button', { name: /retry/i } )
				).toBeInTheDocument();
			} );
		} );
	} );
} );
