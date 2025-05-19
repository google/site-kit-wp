/**
 * UserMenu tests.
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
import { ENTER, ESCAPE, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	fireEvent,
	provideUserInfo,
	provideSiteInfo,
	act,
	waitFor,
} from '../../../../tests/js/test-utils';
import UserMenu from '.';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

describe( 'UserMenu', () => {
	let registry;
	let oldLocation;
	const locationAssignMock = jest.fn();

	beforeAll( () => {
		registry = createTestRegistry();

		oldLocation = global.location;
		delete global.location;
		global.location = Object.defineProperties(
			{},
			{
				assign: {
					configurable: true,
					value: locationAssignMock,
				},
			}
		);
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

	describe( 'opening and closing the menu', () => {
		let container;
		let menu;
		beforeEach( () => {
			provideUserInfo( registry );
			provideSiteInfo( registry );
			container = render( <UserMenu />, { registry } ).container;
			fireEvent.click(
				container.querySelector(
					'.googlesitekit-user-selector .googlesitekit-header__dropdown'
				)
			);
			menu = container.querySelector( '#user-menu' );
		} );

		it( 'should not show Manage Sites option when not using proxy', () => {
			act( () => {
				provideSiteInfo( registry, {
					usingProxy: false,
					proxyPermissionsURL: null,
				} );
			} );

			expect(
				container.querySelector( '#user-menu' ).children.length
			).toEqual( 2 );
		} );

		it( 'should open the menu when clicked', () => {
			expect( menu ).toHaveAttribute( 'aria-hidden', 'false' );
		} );

		it( 'should close the menu when clicked outside', () => {
			fireEvent.mouseDown( document.body );

			expect( menu ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		it( 'should close the menu when escape is pressed', () => {
			fireEvent.keyUp( document, { keyCode: ESCAPE } );
			expect( menu ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		describe( 'clicking the disconnect menu item', () => {
			beforeEach( async () => {
				fireEvent.click( menu.children[ 2 ] );

				await waitFor( () => {
					expect(
						document.querySelector( '.mdc-dialog--open' )
					).toBeInTheDocument();
				} );
			} );

			it( 'should open the modal dialog', () => {
				expect( document.querySelector( '.mdc-dialog' ) ).toHaveClass(
					'mdc-dialog--open'
				);
			} );

			it( 'should close the modal dialog after pressing escape key', async () => {
				fireEvent.keyUp( document, { keyCode: ESCAPE } );

				await waitFor( () => {
					expect(
						document.querySelector( '.mdc-dialog--closing' )
					).not.toBeInTheDocument();
				} );

				[ 'mdc-dialog--opening', 'mdc-dialog--open' ].forEach(
					( className ) => {
						expect(
							document.querySelector( className )
						).not.toBeInTheDocument();
					}
				);
			} );

			it( 'should redirect user to Site Kit splash screen and clear storage', async () => {
				fireEvent.click(
					document.querySelector(
						'.mdc-dialog--open .mdc-button--danger'
					)
				);

				await waitFor( () => {
					const dialog =
						document.querySelector( '.mdc-dialog--open' );

					expect( dialog ).not.toBeInTheDocument();
				} );

				expect( localStorage.clear ).toHaveBeenCalled();
				expect( sessionStorage.clear ).toHaveBeenCalled();

				expect( locationAssignMock ).toHaveBeenCalled();

				const url = new URL( locationAssignMock.mock.calls[ 0 ][ 0 ] );
				expect( url.pathname ).toBe( '/wp-admin/admin.php' );
				expect( url.href ).toMatchQueryParameters( {
					page: 'googlesitekit-splash',
					googlesitekit_context: 'revoked',
				} );
			} );
		} );

		it( 'clicking Manage Sites option should go to Site Kit permissions page', async () => {
			const proxyPermissionsURL = registry
				.select( CORE_SITE )
				.getProxyPermissionsURL();

			fireEvent.click( menu.children[ 1 ] );

			await waitFor( () => {
				expect( locationAssignMock ).toHaveBeenCalled();
			} );

			const url = locationAssignMock.mock.calls[ 1 ][ 0 ];
			expect( url ).toEqual( proxyPermissionsURL );
		} );

		it( 'should select a menu option on pressing space', async () => {
			fireEvent.keyDown( menu.children[ 2 ], { keyCode: SPACE } );

			await waitFor( () => {
				expect(
					document.querySelector( '.mdc-dialog--open' )
				).toBeInTheDocument();
			} );
		} );

		it( 'should select a menu option on pressing enter', async () => {
			fireEvent.keyDown( menu.children[ 2 ], { keyCode: ENTER } );

			await waitFor( () => {
				expect(
					document.querySelector( '.mdc-dialog--open' )
				).toBeInTheDocument();
			} );
		} );
	} );
} );
