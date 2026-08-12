/**
 * Sign in with Google Module Client ID component tests.
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
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';
import ClientIDTextField from './ClientIDTextField';

describe( 'ClientIDTextField', () => {
	const invalidClientIDMessage =
		'A valid Client ID is required to use Sign in with Google';
	const existingClientIDMessage =
		'Sign in with Google was already set up on this site. We recommend using your existing Client ID.';

	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'shows the invalid Client ID message and marks the input invalid when the Client ID holds a space', () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( { clientID: 'client id.apps.example.com' } );

		const { container, getByRole, getByText } = render(
			<ClientIDTextField />,
			{ registry }
		);

		expect( container.querySelector( '.mdc-text-field' ) ).toHaveClass(
			'mdc-text-field--error'
		);
		expect( getByText( invalidClientIDMessage ) ).toBeVisible();
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-errormessage',
			getByText( invalidClientIDMessage ).id
		);
	} );

	it( 'shows the existing Client ID recommendation with no error outline and no `aria-invalid` when an existing Client ID fills the field', () => {
		const existingClientID = 'existing.apps.example.com';

		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( { clientID: '' } );

		const { container, getByRole, getByText } = render(
			<ClientIDTextField existingClientID={ existingClientID } />,
			{ registry }
		);

		expect( getByText( existingClientIDMessage ) ).toBeVisible();
		expect( container.querySelector( '.mdc-text-field' ) ).not.toHaveClass(
			'mdc-text-field--error'
		);
		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).not.toBeInTheDocument();
		expect( getByRole( 'textbox' ) ).not.toHaveAttribute( 'aria-invalid' );
	} );
} );
