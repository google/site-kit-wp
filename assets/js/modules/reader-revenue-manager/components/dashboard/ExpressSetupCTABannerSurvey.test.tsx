/**
 * ExpressSetupCTABannerSurvey component tests.
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
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { EDIT_SCOPE } from '@/js/modules/analytics-4/datastore/constants';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_NOTIFICATION_IDS,
} from '@/js/modules/reader-revenue-manager/constants';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { NOTIFICATIONS } from '@/js/modules/reader-revenue-manager/notifications';
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
import ExpressSetupCTABannerSurvey from './ExpressSetupCTABannerSurvey';

const NOTIFICATION_ID =
	RRM_EXPRESS_SETUP_NOTIFICATION_IDS[ EXPRESS_SETUP_CTAS.SURVEY ];

const activationEndpoint = new RegExp(
	'^/google-site-kit/v1/core/modules/data/activation'
);
const authenticationEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/authentication'
);

const ExpressSetupCTABannerSurveyComponent = withNotificationComponentProps(
	NOTIFICATION_ID
)( ExpressSetupCTABannerSurvey );

describe( 'ExpressSetupCTABannerSurvey', () => {
	mockLocation();

	let registry: ReturnType< typeof createTestRegistry >;

	function provideAuthentication( grantedScopes: string[] = [] ) {
		const authentication = {
			authenticated: true,
			needsReauthentication: false,
			requiredScopes: [],
			grantedScopes,
			unsatisfiedScopes: [],
		};

		provideUserAuthentication( registry, authentication );

		fetchMock.get( authenticationEndpoint, { body: authentication } );
	}

	function renderBanner() {
		return render( <ExpressSetupCTABannerSurveyComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
	}

	async function clickCTAAndGetConnectURL(
		getByRole: ReturnType< typeof render >[ 'getByRole' ]
	) {
		fireEvent.click( getByRole( 'button', { name: /Set up a survey/i } ) );

		await waitFor( () =>
			expect( global.location.assign ).toHaveBeenCalled()
		);

		return new URL(
			( global.location.assign as jest.Mock ).mock.calls[ 0 ][ 0 ]
		);
	}

	function getRequestedScopes( connectURL: URL ) {
		return Array.from( connectURL.searchParams.entries() )
			.filter( ( [ key ] ) => key.startsWith( 'additional_scopes[' ) )
			.map( ( [ , scope ] ) => scope.replace( /^gttp/, 'http' ) );
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
		provideAuthentication();

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				NOTIFICATION_ID,
				NOTIFICATIONS[ NOTIFICATION_ID ]
			);

		fetchMock.postOnce( activationEndpoint, {
			body: { success: true },
		} );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ NOTIFICATION_ID ],
			status: 200,
		} );
	} );

	it( 'should render the survey copy and link "Learn more" to the survey documentation', () => {
		const { getByText, getByRole } = renderBanner();

		expect(
			getByText( 'Learn more about your readers' )
		).toBeInTheDocument();

		expect(
			getByText(
				/Add a short survey to your site and get to know who’s reading: their interests, habits, and what brings them back\./
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /Set up a survey/i } )
		).toBeInTheDocument();

		expect( getByRole( 'link', { name: /Learn more/i } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'doc=rrm-survey' )
		);
	} );

	it( 'should redirect to the survey setup when "Set up a survey" is clicked', async () => {
		const { getByRole } = renderBanner();

		const connectURL = await clickCTAAndGetConnectURL( getByRole );

		expect(
			connectURL.searchParams.get( 'redirect' )
		).toMatchQueryParameters( {
			page: 'googlesitekit-dashboard',
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			expressSetup: 'true',
			cta: 'survey',
		} );
	} );

	it( 'should request the Analytics edit scope when it has not been granted', async () => {
		const { getByRole } = renderBanner();

		const connectURL = await clickCTAAndGetConnectURL( getByRole );

		expect( getRequestedScopes( connectURL ) ).toContain( EDIT_SCOPE );
	} );

	it( 'should not request the Analytics edit scope when it has already been granted', async () => {
		provideAuthentication( [ EDIT_SCOPE ] );

		const { getByRole } = renderBanner();

		const connectURL = await clickCTAAndGetConnectURL( getByRole );

		expect( getRequestedScopes( connectURL ) ).not.toContain( EDIT_SCOPE );
	} );

	it( 'should permanently dismiss the notification when "Set up a survey" is clicked', async () => {
		const { getByRole } = renderBanner();

		await clickCTAAndGetConnectURL( getByRole );

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

		expect(
			registry.select( CORE_USER ).isItemDismissed( NOTIFICATION_ID )
		).toBe( true );
	} );

	it( 'should permanently dismiss the notification when "No thanks" is clicked', async () => {
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

		expect(
			registry.select( CORE_USER ).isItemDismissed( NOTIFICATION_ID )
		).toBe( true );
	} );
} );
