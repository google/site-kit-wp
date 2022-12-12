/**
 * EnableAutoUpdateBannerNotification component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import {
	render,
	createTestRegistry,
	screen,
	waitFor,
	act,
	fireEvent,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import EnableAutoUpdateBannerNotification from './EnableAutoUpdateBannerNotification';
import API from 'googlesitekit-api';

import mockUseQueryArg from '../../hooks/useQueryArg';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
jest.mock( '../../hooks/useQueryArg' );

// setup mockImplementation for `useQueryArg`
function stubMockUseQueryArg( isNewPluginInstall = false ) {
	mockUseQueryArg.mockImplementation( ( queryArg ) => {
		if ( isNewPluginInstall && queryArg === 'notification' ) {
			return [ 'authentication_success' ];
		}
		return [ false ];
	} );
}

describe( 'EnableAutoUpdateBannerNotification', () => {
	const registry = createTestRegistry();

	beforeEach( () => {
		jest.resetAllMocks();
		stubMockUseQueryArg();

		jest.spyOn( API, 'getItem' ).mockImplementation( () => {
			return Promise.resolve( {
				cacheHit: false,
				value: undefined,
			} );
		} );

		jest.spyOn( API, 'setItem' ).mockImplementation( () => {
			return Promise.resolve( true );
		} );
	} );

	it( 'should display the notification if Site Kit was not recently set up and user can update plugins', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			autoUpdatesEnabled: true,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect(
			await screen.findByText( 'Keep Site Kit up-to-date' )
		).toBeInTheDocument();
	} );

	it( 'should not show the notification when user can not update plugins', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			autoUpdatesEnabled: true,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: false,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not show the notification when plugin auto updates are disabled', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			autoUpdatesEnabled: false,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not show the notification when hide banner cache key is set', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			autoUpdatesEnabled: true,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		jest.spyOn( API, 'getItem' ).mockImplementation( () => {
			return Promise.resolve( {
				cacheHit: true,
				value: true,
				isError: false,
			} );
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		await waitFor( () => expect( API.getItem ).toHaveBeenCalledTimes( 1 ) );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should send enable-auto-updates post request to admin-ajax on cta click.', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			autoUpdatesEnabled: true,
			updatePluginNonce: '751b9198d2',
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		global.ajaxurl = 'admin-ajax.php';

		fetchMock.postOnce( /^\/admin-ajax.php/, {
			body: { success: true },
			status: 200,
		} );

		act( () => {
			render( <EnableAutoUpdateBannerNotification />, {
				registry,
			} );
		} );

		expect(
			await screen.findByText( 'Keep Site Kit up-to-date' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Enable auto-updates' ) );

		await waitFor( () => expect( fetchMock ).toHaveFetchedTimes( 1 ) );

		delete global.ajaxurl;
	} );

	it( 'should not show the notification directly after Site Kit initial setup', async () => {
		stubMockUseQueryArg( true );

		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			autoUpdatesEnabled: true,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		let container;

		act( () => {
			( { container } = render( <EnableAutoUpdateBannerNotification />, {
				registry,
			} ) );
		} );

		await waitFor( () =>
			// When the component is rendered after the initial
			// Site Kit setup, we hide the notification and prevent
			// it from being displayed for ten minutes.
			//
			// Wait until that `setItem` call delaying the
			// notification is called before checking the output
			// of the component.
			expect( API.setItem ).toHaveBeenCalledTimes( 1 )
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
