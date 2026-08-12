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
import * as factories from '@/js/modules/tagmanager/datastore/__factories__';
import {
	FORM_SETUP,
	MODULES_TAGMANAGER,
} from '@/js/modules/tagmanager/datastore/constants';
import { createTestRegistry, render } from '@tests/js/test-utils';
import ContainerNameTextField from './ContainerNameTextField';

describe( 'ContainerNameTextField', () => {
	const accountID = '123';
	const existingContainerName = 'Example Container';

	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetContainers(
			[
				factories.containerBuilder( {
					overrides: { name: existingContainerName },
				} ),
			],
			{ accountID }
		);
	} );

	function renderContainerNameTextField() {
		return render(
			<ContainerNameTextField
				label="Container Name"
				name="containerName"
			/>,
			{ registry }
		);
	}

	it( 'keeps "A container name is required." off the screen and marks the input invalid when the container name is empty', () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { containerName: '' } );

		const { container, getByRole, getByText } =
			renderContainerNameTextField();

		expect( container.querySelector( '.mdc-text-field' ) ).toHaveClass(
			'mdc-text-field--error'
		);

		const errorMessage = getByText( 'A container name is required.' );

		expect( errorMessage ).toHaveClass( 'screen-reader-text' );
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-invalid',
			'true'
		);
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-errormessage',
			errorMessage.id
		);
	} );

	it( 'shows "A container with this name already exists" when the container name matches an existing container', () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { containerName: existingContainerName } );

		const { container, getByRole, getByText } =
			renderContainerNameTextField();

		expect( container.querySelector( '.mdc-text-field' ) ).toHaveClass(
			'mdc-text-field--error'
		);

		const errorMessage = getByText(
			'A container with this name already exists'
		);

		expect( errorMessage ).toBeVisible();
		expect( getByRole( 'textbox' ) ).toHaveAttribute(
			'aria-errormessage',
			errorMessage.id
		);
	} );

	it( 'shows no error message and leaves the input valid when the container name matches no existing container', () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { containerName: 'A Free Name' } );

		const { container, getByRole, queryByText } =
			renderContainerNameTextField();

		expect( container.querySelector( '.mdc-text-field' ) ).not.toHaveClass(
			'mdc-text-field--error'
		);
		expect(
			queryByText( 'A container name is required.' )
		).not.toBeInTheDocument();
		expect(
			queryByText( 'A container with this name already exists' )
		).not.toBeInTheDocument();
		expect( getByRole( 'textbox' ) ).not.toHaveAttribute( 'aria-invalid' );
	} );
} );
