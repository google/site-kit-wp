/**
 * ResetButton tests.
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
import { render, createTestRegistry, fireEvent, act } from '../../../tests/js/test-utils';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
import ResetButton from './ResetButton';
import { subscribeUntil } from '../../../tests/js/utils';

describe( 'ResetButton', () => {
	let registry;
	const adminURL = 'http://example.com/';

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { adminURL } );
	} );

	it( 'should render "Reset Site Kit" as the default child', () => {
		const { container } = render( <ResetButton />, { registry } );
		expect( container ).toHaveTextContent( 'Reset Site Kit' );
	} );

	it( 'should render passed children inside of the button', () => {
		const { container } = render( <ResetButton>Test Value</ResetButton>, { registry } );
		expect( container ).toHaveTextContent( 'Test Value' );
		expect( document.querySelector( '.mdc-dialog--open' ) ).toBeNull();
	} );

	describe( 'after click', () => {
		let container;
		beforeEach( () => {
			( { container } = render( <ResetButton />, { registry } ) );
			fireEvent.click( container.querySelector( '.googlesitekit-reset-button' ) );
		} );

		it( 'should open the dialog', async () => {
			expect( document.querySelector( '.mdc-dialog--open' ) ).toBeTruthy();
		} );

		it( 'should show reset and cancel buttons', async () => {
			expect( document.querySelector( '.mdc-dialog--open .mdc-dialog__cancel-button' ) ).toBeTruthy();
			expect( document.querySelector( '.mdc-dialog--open .mdc-button--danger' ) ).toBeTruthy();
		} );

		it( 'should close the modal on clicking cancel', async () => {
			fireEvent.click( document.querySelector( '.mdc-dialog--open .mdc-dialog__cancel-button' ) );
			expect( document.querySelector( '.mdc-dialog--open' ) ).toBeNull();
		} );

		it( 'should close the modal on pressing escape key', async () => {
			fireEvent.keyUp( global, { keyCode: 27 } );
			expect( document.querySelector( '.mdc-dialog--open' ) ).toBeNull();
		} );

		it( 'should close the modal on clicking Reset, reset the plugin and delete localstorage', async () => {
			const response = true;
			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/core\/site\/data\/reset/,
				{ body: JSON.stringify( response ), status: 200 },
			);

			Object.defineProperty( global.window, 'location', {
				value: {
					href: 'validurl',
				},
				writable: true,
			} );

			await act( async () => {
				fireEvent.click( document.querySelector( '.mdc-dialog--open .mdc-button--danger' ) );
				await subscribeUntil( registry, () => registry.select( CORE_SITE ).isDoingReset() === false );
			} );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( document.querySelector( '.mdc-dialog--open' ) ).toBeNull();
			expect( localStorage.clear ).toHaveBeenCalled();
			expect( global.location.href ).toBe( 'http://example.com/admin.php?page=googlesitekit-splash&notification=reset_success' );
		} );
	} );
} );
