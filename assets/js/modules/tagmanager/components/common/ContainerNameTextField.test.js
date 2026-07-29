/**
 * ContainerNameTextField component tests.
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
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	FORM_SETUP,
	MODULES_TAGMANAGER,
} from '@/js/modules/tagmanager/datastore/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';
import ContainerNameTextField from './ContainerNameTextField';

describe( 'ContainerNameTextField', () => {
	const accountID = '12345';

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetContainers( [], {
			accountID,
		} );
	} );

	it( 'should show an accessible error state when the name is empty', () => {
		const { container, getByText } = render(
			<ContainerNameTextField
				label="Container Name"
				name="containerName"
			/>,
			{ registry }
		);

		const input = container.querySelector( 'input' );

		expect(
			container
				.querySelector( '.mdc-text-field' )
				.classList.contains( 'mdc-text-field--error' )
		).toBe( true );

		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).toBeInTheDocument();

		const requiredMessage = getByText( 'A container name is required' );

		expect( requiredMessage ).toBeInTheDocument();
		expect( requiredMessage ).toHaveClass( 'screen-reader-text' );

		expect( input ).toHaveAttribute( 'aria-invalid', 'true' );
		expect( input ).toHaveAttribute(
			'aria-errormessage',
			requiredMessage.getAttribute( 'id' )
		);
	} );

	it( 'should show an error message when the name already exists', () => {
		registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
			containerName: 'Existing Container',
		} );

		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( [ { name: 'Existing Container' } ], {
				accountID,
			} );

		const { container, getByText } = render(
			<ContainerNameTextField
				label="Container Name"
				name="containerName"
			/>,
			{ registry }
		);

		expect(
			container
				.querySelector( '.mdc-text-field' )
				.classList.contains( 'mdc-text-field--error' )
		).toBe( true );

		const errorMessage = getByText(
			'A container with this name already exists'
		);

		expect( errorMessage ).toBeInTheDocument();

		const input = container.querySelector( 'input' );

		expect( input ).toHaveAttribute( 'aria-invalid', 'true' );
		expect( input ).toHaveAttribute(
			'aria-errormessage',
			errorMessage.getAttribute( 'id' )
		);
	} );

	it( 'should have no error state when the name is set and unique', () => {
		registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
			containerName: 'My Container',
		} );

		const { container } = render(
			<ContainerNameTextField
				label="Container Name"
				name="containerName"
			/>,
			{ registry }
		);

		expect(
			container
				.querySelector( '.mdc-text-field' )
				.classList.contains( 'mdc-text-field--error' )
		).toBe( false );

		expect(
			container.querySelector( '.googlesitekit-text-field-icon--error' )
		).not.toBeInTheDocument();

		const input = container.querySelector( 'input' );

		expect( input ).not.toHaveAttribute( 'aria-invalid' );
	} );
} );
