/**
 * UserMenu tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { render, createTestRegistry, fireEvent } from '../../../tests/js/test-utils';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
import UserMenu from './UserMenu';
import { STORE_NAME as CORE_USER } from '../googlesitekit/datastore/user/constants';

describe( 'UserMenu', () => {
	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			proxyPermissionsURL: 'https://sitekit.withgoogle.com/site-management/permissions/',
		} );
		registry.dispatch( CORE_USER ).receiveUserInfo( {
			email: 'test@example.com',
			picture: 'http://www.gravatar.com/avatar',
		} );
	} );

	describe( 'on clicking the UserMenu', () => {
		let container;
		let menu;
		beforeEach( () => {
			container = render( <UserMenu />, { registry } ).container;
			fireEvent.click( container.querySelector( '.googlesitekit-header__dropdown span' ) );
			menu = container.querySelector( '#user-menu' );
		} );

		it( 'should open menu', () => {
			expect( menu ).toHaveAttribute( 'aria-hidden', 'false' );
		} );

		it( 'should close the menu when clicked outside', () => {
			fireEvent.mouseUp( document.body );
			expect( menu ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		it( 'should close the menu when escape is pressed', () => {
			fireEvent.keyUp( document, { keyCode: 27 } );
			expect( menu ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		describe( 'and clicking first menu option', () => {
			it( 'should open the modal dialog', () => {
				fireEvent.click( menu.children[ 0 ] );
				expect( document.querySelector( '.mdc-dialog--open' ) ).toBeTruthy();
			} );

			it( 'should close the modal dialog after pressing escape key', () => {
				fireEvent.keyUp( document, { keyCode: 27 } );
				expect( document.querySelector( '.mdc-dialog--open' ) ).toBeNull();
			} );
		} );

		it( 'should select a menu option on pressing space', () => {
			fireEvent.keyDown( menu.children[ 0 ], { keyCode: 32 } );
			expect( document.querySelector( '.mdc-dialog--open' ) ).toBeTruthy();
		} );

		it( 'should select a menu option on pressing enter', () => {
			fireEvent.keyDown( menu.children[ 0 ], { keyCode: 13 } );
			expect( document.querySelector( '.mdc-dialog--open' ) ).toBeTruthy();
		} );
	} );
} );
