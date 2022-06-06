/**
 * AdSenseConnectCTA component tests.
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
 * WordPress dependencies
 */
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import AdSenseConnectCTA from './AdSenseConnectCTA';
import {
	act,
	fireEvent,
	render,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { withActive } from '../../../../googlesitekit/modules/datastore/__fixtures__';

describe( 'AdSenseConnectCTA', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( MODULES_ADSENSE ).setSettings( {} );
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'adsense' ) );
	} );

	describe( 'after click', () => {
		let container;
		beforeEach( () => {
			container = render( <AdSenseConnectCTA />, { registry } ).container;
			fireEvent.click(
				container.querySelector( 'button.googlesitekit-cta-link' )
			);
		} );

		it( 'should open the dialog', async () => {
			expect(
				document.querySelector( '.mdc-dialog--open' )
			).toBeInTheDocument();
		} );

		it( 'should close the modal on clicking cancel', async () => {
			await act( async () => {
				fireEvent.click(
					document.querySelector(
						'.mdc-dialog--open .googlesitekit-cta-link'
					)
				);
			} );
			expect(
				document.querySelector( '.mdc-dialog--open' )
			).not.toBeInTheDocument();
		} );

		it( 'should close the modal on pressing escape key', async () => {
			fireEvent.keyUp( global, { keyCode: ESCAPE } );
			expect(
				document.querySelector( '.mdc-dialog--open' )
			).not.toBeInTheDocument();
		} );

		it( 'should make the correct API request', async () => {
			const response = [ 'adsense-connect-cta' ];
			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/core\/user\/data\/dismiss-item/,
				{ body: JSON.stringify( response ), status: 200 }
			);

			await act( async () => {
				fireEvent.click(
					document.querySelector(
						'.mdc-dialog--open .mdc-button--raised'
					)
				);
			} );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				document.querySelector( '.mdc-dialog--open' )
			).toBeInTheDocument();
		} );
	} );
} );
