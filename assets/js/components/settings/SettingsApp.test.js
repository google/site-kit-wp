/**
 * SettingsApp component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { createHashHistory } from 'history';

/**
 * Internal dependencies
 */
import SettingsApp from './SettingsApp';
import {
	render,
	fireEvent,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	muteFetch,
	act,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import { VIEW_CONTEXT_SETTINGS } from '../../googlesitekit/constants';

const coreUserTrackingSettingsEndpointRegExp = new RegExp(
	'^/google-site-kit/v1/core/user/data/tracking'
);
const coreUserTrackingResponse = { status: 200, body: { enabled: false } };

describe( 'SettingsApp', () => {
	// Create hash history to interact with HashRouter using `history.push`
	const history = createHashHistory();
	const getTabID = ( path ) => SettingsApp.basePathToTabIndex[ path ];
	let registry;

	beforeEach( () => {
		global.location.hash = '';

		registry = createTestRegistry();
		registry
			.dispatch( CORE_USER )
			.receiveGetAuthentication( { needsReauthentication: false } );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry
			.dispatch( CORE_SITE )
			.receiveGetAdminBarSettings( { enabled: true } );
		registry
			.dispatch( CORE_SITE )
			.receiveGetConsentModeSettings( { enabled: false } );
		registry.dispatch( CORE_SITE ).receiveGetConsentAPIInfo( {
			hasConsentAPI: false,
			wpConsentPlugin: {
				installed: false,
				activateURL:
					'http://example.com/wp-admin/plugins.php?action=activate&plugin=some-plugin',
				installURL:
					'http://example.com/wp-admin/update.php?action=install-plugin&plugin=some-plugin',
			},
		} );

		provideSiteInfo( registry, {
			proxySupportLinkURL: 'https://test.com',
		} );

		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
				SettingsEditComponent() {
					return <div data-testid="edit-component">edit</div>;
				},
			},
			{
				slug: 'tagmanager',
				active: true,
				connected: true,
			},
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
			{
				slug: 'pagespeed-insights',
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	} );

	it( 'should switch to "/connected-services" route when corresponding tab is clicked.', async () => {
		fetchMock.getOnce(
			coreUserTrackingSettingsEndpointRegExp,
			coreUserTrackingResponse
		);

		muteFetch(
			new RegExp( '^/google-site-kit/v1/modules/search-console/data' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/modules/analytics-4/data' )
		);

		history.push( '/admin-settings' );

		const { getAllByRole, waitForRegistry } = render( <SettingsApp />, {
			history,
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );
		await waitForRegistry();

		fireEvent.click(
			getAllByRole( 'tab' )[ getTabID( 'connected-services' ) ]
		);

		expect( global.location.hash ).toEqual( '#/connected-services' );
	} );

	it( 'should switch to "/connect-more-services" route when corresponding tab is clicked.', () => {
		const { getAllByRole } = render( <SettingsApp />, {
			history,
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		fireEvent.click(
			getAllByRole( 'tab' )[ getTabID( 'connect-more-services' ) ]
		);
		expect( global.location.hash ).toEqual( '#/connect-more-services' );
	} );

	it( 'should switch to "/admin-settings" route when corresponding tab is clicked.', async () => {
		fetchMock.getOnce(
			coreUserTrackingSettingsEndpointRegExp,
			coreUserTrackingResponse
		);
		fetchMock.postOnce(
			coreUserTrackingSettingsEndpointRegExp,
			coreUserTrackingResponse
		);

		muteFetch(
			new RegExp( '^/google-site-kit/v1/modules/search-console/data' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/modules/analytics-4/data' )
		);

		await registry.dispatch( CORE_USER ).setTrackingEnabled( false );

		const { getAllByRole, waitForRegistry } = render( <SettingsApp />, {
			history,
			registry,
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		await waitForRegistry();

		fireEvent.click(
			getAllByRole( 'tab' )[ getTabID( 'admin-settings' ) ]
		);

		await act( waitForRegistry );

		expect( global.location.hash ).toEqual( '#/admin-settings' );
	} );
} );
