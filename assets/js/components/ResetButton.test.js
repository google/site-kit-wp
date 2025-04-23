/**
 * ResetButton tests.
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
import {
	render,
	createTestRegistry,
	fireEvent,
	act,
	provideSiteInfo,
	waitFor,
} from '../../../tests/js/test-utils';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import ResetButton from './ResetButton';
import { subscribeUntil } from '../../../tests/js/utils';

describe( 'ResetButton', () => {
	let registry;
	let oldLocation;
	const locationAssignMock = jest.fn();

	beforeAll( () => {
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

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'should render "Reset Site Kit" as the default child', () => {
		const { container } = render( <ResetButton />, { registry } );
		expect( container ).toHaveTextContent( 'Reset Site Kit' );
	} );

	it( 'should render passed children inside of the button', () => {
		const { container } = render( <ResetButton>Test Value</ResetButton>, {
			registry,
		} );
		expect( container ).toHaveTextContent( 'Test Value' );
		expect(
			document.querySelector( '.mdc-dialog--open' )
		).not.toBeInTheDocument();
	} );

	describe( 'after click', () => {
		let container;
		beforeEach( async () => {
			container = render( <ResetButton />, { registry } ).container;
			fireEvent.click(
				container.querySelector( '.googlesitekit-reset-button' )
			);

			await waitFor( () => {
				expect(
					document.querySelector( '.mdc-dialog--open' )
				).toBeInTheDocument();
			} );
		} );

		it( 'should open the dialog', () => {
			expect( document.querySelector( '.mdc-dialog' ) ).toHaveClass(
				'mdc-dialog--open'
			);
		} );

		it( 'should show reset and cancel buttons', () => {
			expect(
				document.querySelector(
					'.mdc-dialog--open .mdc-dialog__cancel-button'
				)
			).toBeInTheDocument();
			expect(
				document.querySelector(
					'.mdc-dialog--open .mdc-button--danger'
				)
			).toBeInTheDocument();
		} );

		it( 'should close the modal on clicking cancel', async () => {
			fireEvent.click(
				document.querySelector(
					'.mdc-dialog--open .mdc-dialog__cancel-button'
				)
			);

			await waitFor( () => {
				expect(
					document.querySelector( '.mdc-dialog--closing' )
				).not.toBeInTheDocument();
			} );

			expect(
				document.querySelector( '.mdc-dialog--open' )
			).not.toBeInTheDocument();

			// Verify that none of .mdc-dialog--opening, .mdc-dialog--open or .mdc-dialog--closing are applied to the .mdc-dialog element.
			const dialogElement = document.querySelector( '.mdc-dialog' );
			expect( dialogElement ).not.toHaveClass( 'mdc-dialog--opening' );
			expect( dialogElement ).not.toHaveClass( 'mdc-dialog--open' );
			expect( dialogElement ).not.toHaveClass( 'mdc-dialog--closing' );
		} );

		it( 'should close the modal on pressing escape key', async () => {
			fireEvent.keyUp( global, { keyCode: ESCAPE } );

			await waitFor( () => {
				expect(
					document.querySelector( '.mdc-dialog--closing' )
				).not.toBeInTheDocument();
			} );

			expect(
				document.querySelector( '.mdc-dialog--open' )
			).not.toBeInTheDocument();

			// Verify that none of .mdc-dialog--opening, .mdc-dialog--open or .mdc-dialog--closing are applied to the .mdc-dialog element.
			const dialogElement = document.querySelector( '.mdc-dialog' );
			expect( dialogElement ).not.toHaveClass( 'mdc-dialog--opening' );
			expect( dialogElement ).not.toHaveClass( 'mdc-dialog--open' );
			expect( dialogElement ).not.toHaveClass( 'mdc-dialog--closing' );
		} );

		it( 'should reset the plugin, delete local and session storage', async () => {
			const response = true;
			fetchMock.postOnce(
				new RegExp( '^/google-site-kit/v1/core/site/data/reset' ),
				{ body: JSON.stringify( response ), status: 200 }
			);

			await act( async () => {
				fireEvent.click(
					document.querySelector(
						'.mdc-dialog--open .mdc-button--danger'
					)
				);
				await subscribeUntil(
					registry,
					() => registry.select( CORE_SITE ).isDoingReset() === false
				);
			} );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				document.querySelector( '.mdc-dialog--open' )
			).toBeInTheDocument();
			expect( localStorage.clear ).toHaveBeenCalled();
			expect( sessionStorage.clear ).toHaveBeenCalled();

			expect( locationAssignMock ).toHaveBeenCalled();
			const url = new URL( locationAssignMock.mock.calls[ 0 ][ 0 ] );
			expect( url.pathname ).toBe( '/wp-admin/admin.php' );
			expect( url.href ).toMatchQueryParameters( {
				page: 'googlesitekit-splash',
				notification: 'reset_success',
			} );
		} );
	} );
} );
