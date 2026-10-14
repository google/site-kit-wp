/**
 * RRM ExpressSetupBannerWidget component tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG,
} from '@/js/modules/reader-revenue-manager/constants';
import { READONLY_SCOPE } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { trackEvent } from '@/js/util';
import {
	mockIntersectionObserver,
	mockLocation,
} from '@tests/js/mock-browser-utils';
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
import ExpressSetupBannerWidget from '.';

jest.mock( '@/js/util', () => ( {
	...( jest.requireActual( '@/js/util' ) as Record< string, unknown > ),
	trackEvent: jest.fn(),
} ) );

const WidgetWithComponentProps = withWidgetComponentProps(
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG
)( ExpressSetupBannerWidget );

const { getObservedElements, simulateIntersection } =
	mockIntersectionObserver();

function setupRegistry() {
	const registry = createTestRegistry();
	provideModules( registry );
	provideModuleRegistrations( registry );
	provideSiteInfo( registry );
	provideUserCapabilities( registry );

	return registry;
}

describe( 'ExpressSetupBannerWidget', () => {
	mockLocation();

	beforeEach( () => {
		( trackEvent as jest.Mock ).mockReset();
	} );

	it( 'should request the missing manage scope and return to newsletter setup', async () => {
		const registry = setupRegistry();
		const authentication = {
			authenticated: true,
			needsReauthentication: false,
			requiredScopes: [ READONLY_SCOPE ],
			grantedScopes: [ READONLY_SCOPE ],
			unsatisfiedScopes: [],
		};
		provideUserAuthentication( registry, authentication );
		registry
			.dispatch( CORE_USER )
			.receiveConnectURL( 'http://example.com/connect' );
		fetchMock.postOnce(
			/^\/google-site-kit\/v1\/core\/modules\/data\/activation/,
			{ body: { success: true } }
		);
		fetchMock.getOnce(
			/^\/google-site-kit\/v1\/core\/user\/data\/authentication/,
			{ body: authentication }
		);

		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
		fireEvent.click(
			getByRole( 'button', { name: 'Set up a sign-up form' } )
		);
		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalled()
		);
		const connectURL = new URL(
			( global.location.assign as jest.Mock ).mock.calls[ 0 ][ 0 ]
		);
		expect( connectURL.origin + connectURL.pathname ).toBe(
			'http://example.com/connect'
		);
		expect( connectURL.searchParams.get( 'additional_scopes[0]' ) ).toBe(
			'gttps://www.googleapis.com/auth/webcontentpublisher.publications.manage'
		);
		expect( connectURL.searchParams.has( 'additional_scopes[1]' ) ).toBe(
			false
		);
		expect(
			connectURL.searchParams.get( 'redirect' )
		).toMatchQueryParameters( {
			page: 'googlesitekit-dashboard',
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			expressSetup: 'true',
			cta: 'newsletter-signup',
		} );

		expect( trackEvent ).toHaveBeenCalledWith(
			'mainDashboard_rrm-express-setup-widget',
			'confirm_notification',
			'newsletter-signup'
		);
	} );

	it( 'should track the "view_notification" event when the banner comes into view', () => {
		const registry = setupRegistry();

		render( <WidgetWithComponentProps />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const observedElements = getObservedElements();
		expect( observedElements ).toHaveLength( 1 );

		act( () => {
			simulateIntersection( observedElements[ 0 ], true );
		} );

		expect( trackEvent ).toHaveBeenCalledWith(
			'mainDashboard_rrm-express-setup-widget',
			'view_notification',
			'newsletter-signup'
		);
	} );

	it( 'should track the "dismiss_notification" event when the dismiss button is clicked', async () => {
		const registry = setupRegistry();

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [],
			status: 200,
		} );

		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: 'No thanks' } ) );
		} );

		expect( trackEvent ).toHaveBeenCalledWith(
			'mainDashboard_rrm-express-setup-widget',
			'dismiss_notification',
			'newsletter-signup'
		);
	} );

	it( 'should track the "click_learn_more_link" event when the "Learn more" link is clicked', () => {
		const registry = setupRegistry();

		const { getByRole } = render( <WidgetWithComponentProps />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const learnMoreLink = getByRole( 'link', { name: /learn more/i } );

		learnMoreLink.addEventListener( 'click', ( event ) => {
			event.preventDefault();
		} );

		fireEvent.click( learnMoreLink );

		expect( trackEvent ).toHaveBeenCalledWith(
			'mainDashboard_rrm-express-setup-widget',
			'click_learn_more_link',
			'newsletter-signup'
		);
	} );
} );
