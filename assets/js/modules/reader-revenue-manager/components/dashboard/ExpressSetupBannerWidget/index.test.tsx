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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG,
} from '@/js/modules/reader-revenue-manager/constants';
import { READONLY_SCOPE } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
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

const WidgetWithComponentProps = withWidgetComponentProps(
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG
)( ExpressSetupBannerWidget );

describe( 'ExpressSetupBannerWidget', () => {
	mockLocation();
	it( 'should request the missing manage scope and return to newsletter setup', async () => {
		const registry = createTestRegistry();
		provideModules( registry );
		provideModuleRegistrations( registry );
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
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
	} );
} );
