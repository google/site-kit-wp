/**
 * ExpressSetupCTABanner component tests.
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
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTAS,
	ExpressSetupCTAType,
	MANAGE_SCOPE,
	READONLY_SCOPE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { dismissItemEndpoint } from '@tests/js/mock-dismiss-item-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
	waitFor,
} from '@tests/js/test-utils';
import ExpressSetupCTABanner from './ExpressSetupCTABanner';

const NOTIFICATION_ID = 'test-express-setup-cta-banner';

const activationEndpoint = new RegExp(
	'^/google-site-kit/v1/core/modules/data/activation'
);
const authenticationEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/authentication'
);

describe( 'ExpressSetupCTABanner', () => {
	mockLocation();

	let registry: ReturnType< typeof createTestRegistry >;

	function renderBanner( {
		ctaType = EXPRESS_SETUP_CTAS.SURVEY,
		additionalScopes,
	}: {
		ctaType?: ExpressSetupCTAType;
		additionalScopes?: string[];
	} = {} ) {
		return render(
			<ExpressSetupCTABanner
				additionalScopes={ additionalScopes }
				ctaButtonLabel="Set up the CTA"
				ctaType={ ctaType }
				description="Test description."
				notificationID={ NOTIFICATION_ID }
				title="Test title"
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
	}

	function getConnectURL() {
		return new URL(
			( global.location.assign as jest.Mock ).mock.calls[ 0 ][ 0 ]
		);
	}

	function getAdditionalScopes( connectURL: URL ) {
		const scopes = [];

		for (
			let index = 0;
			connectURL.searchParams.has( `additional_scopes[${ index }]` );
			index++
		) {
			// Scopes in the form of a URL are rewritten in the connect URL to
			// start with `gttp`, so they are restored here for comparison.
			scopes.push(
				connectURL.searchParams
					.get( `additional_scopes[${ index }]` )
					?.replace( /^gttp/, 'http' )
			);
		}

		return scopes;
	}

	async function clickCTAAndWaitForRedirect(
		getByRole: ReturnType< typeof render >[ 'getByRole' ]
	) {
		fireEvent.click( getByRole( 'button', { name: /Set up the CTA/i } ) );

		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalled()
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: false,
				connected: false,
			},
		] );

		provideModuleRegistrations( registry );
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification( NOTIFICATION_ID, {
				Component: () => null,
				areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
				isDismissible: true,
			} );

		fetchMock.postOnce( activationEndpoint, {
			body: { success: true },
		} );

		// Clicking the CTA dismisses the notification.
		fetchMock.post( dismissItemEndpoint, {
			body: [ NOTIFICATION_ID ],
			status: 200,
		} );

		// Activation refreshes the user's authentication state.
		fetchMock.get( authenticationEndpoint, {
			body: registry.select( CORE_USER ).getAuthentication(),
		} );
	} );

	it( 'should render the given copy with the "Powered by" row and the "No thanks" button', () => {
		const { container, getByText, getByRole } = renderBanner();

		expect( getByText( 'Test title' ) ).toBeInTheDocument();
		expect( getByText( /Test description\./ ) ).toBeInTheDocument();

		expect(
			getByText( 'Powered by Reader Revenue Manager' )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /Set up the CTA/i } )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /No thanks/i } )
		).toBeInTheDocument();

		expect(
			container.querySelector(
				'.googlesitekit-banner--express-setup-cta.googlesitekit-banner--express-setup-survey'
			)
		).toBeInTheDocument();
	} );

	it.each( [
		[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP, 'rrm-newsletter' ],
		[ EXPRESS_SETUP_CTAS.SURVEY, 'rrm-survey' ],
	] )(
		'should link "Learn more" to the documentation for the %s CTA',
		( ctaType, doc ) => {
			const { getByRole } = renderBanner( { ctaType } );

			expect(
				getByRole( 'link', { name: /Learn more/i } )
			).toHaveAttribute(
				'href',
				expect.stringContaining( `doc=${ doc }` )
			);
		}
	);

	it( 'should open "Learn more" in a new tab without the external link icon', () => {
		const { getByRole } = renderBanner();

		const learnMoreLink = getByRole( 'link', { name: /Learn more/i } );

		expect( learnMoreLink ).toHaveAttribute( 'target', '_blank' );
		expect( learnMoreLink.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
		EXPRESS_SETUP_CTAS.SURVEY,
	] )(
		'should activate Reader Revenue Manager and redirect to the express setup for the %s CTA',
		async ( ctaType ) => {
			const { getByRole } = renderBanner( { ctaType } );

			await clickCTAAndWaitForRedirect( getByRole );

			expect( fetchMock ).toHaveFetched( activationEndpoint, {
				body: {
					data: {
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: true,
					},
				},
			} );
			expect(
				getConnectURL().searchParams.get( 'redirect' )
			).toMatchQueryParameters( {
				page: 'googlesitekit-dashboard',
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				expressSetup: 'true',
				cta: ctaType,
			} );
		}
	);

	it( 'should permanently dismiss the notification without removing it from the queue when the CTA is clicked', async () => {
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.receiveQueuedNotifications(
				[ { id: NOTIFICATION_ID } ],
				NOTIFICATION_GROUPS.DEFAULT
			);

		const { getByRole } = renderBanner();

		await clickCTAAndWaitForRedirect( getByRole );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: NOTIFICATION_ID,
						expiration: 0,
					},
				},
			} )
		);

		// The banner stays in place, in its in-progress state, until the
		// redirect completes.
		expect(
			registry
				.select( CORE_NOTIFICATIONS )
				.getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				)
				?.map( ( { id }: { id: string } ) => id )
		).toContain( NOTIFICATION_ID );
	} );

	it( 'should request only the express setup scopes by default', async () => {
		const { getByRole } = renderBanner();

		await clickCTAAndWaitForRedirect( getByRole );

		expect( getAdditionalScopes( getConnectURL() ) ).toEqual( [
			READONLY_SCOPE,
			MANAGE_SCOPE,
		] );
	} );

	it( 'should request the given additional scopes after the express setup scopes', async () => {
		const { getByRole } = renderBanner( {
			additionalScopes: [ 'https://example.com/scope' ],
		} );

		await clickCTAAndWaitForRedirect( getByRole );

		expect( getAdditionalScopes( getConnectURL() ) ).toEqual( [
			READONLY_SCOPE,
			MANAGE_SCOPE,
			'https://example.com/scope',
		] );
	} );

	it( 'should show the CTA in progress and disable both buttons while activating', async () => {
		const { getByRole } = renderBanner();

		const ctaButton = getByRole( 'button', { name: /Set up the CTA/i } );

		expect( ctaButton ).toBeEnabled();

		fireEvent.click( ctaButton );

		expect(
			getByRole( 'button', { name: /Set up the CTA/i } )
		).toBeDisabled();

		expect( getByRole( 'button', { name: /No thanks/i } ) ).toBeDisabled();
		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();

		// Clicking again while activation is in progress does nothing.
		fireEvent.click( getByRole( 'button', { name: /Set up the CTA/i } ) );

		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalled()
		);

		expect( fetchMock ).toHaveFetchedTimes( 1, activationEndpoint );
	} );

	it( 'should not activate Reader Revenue Manager when the CTA is clicked by a user who cannot activate modules', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		const { getByRole } = renderBanner();

		fireEvent.click( getByRole( 'button', { name: /Set up the CTA/i } ) );

		expect(
			getByRole( 'button', { name: /Set up the CTA/i } )
		).toBeEnabled();

		expect( fetchMock ).not.toHaveFetched( activationEndpoint );
	} );

	it( 'should dismiss the given notification when "No thanks" is clicked', async () => {
		const { getByRole } = renderBanner();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /No thanks/i } ) );
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: NOTIFICATION_ID,
						expiration: 0,
					},
				},
			} )
		);
	} );
} );
