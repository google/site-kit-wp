/**
 * Reader Revenue Manager PublicationCreate component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	createTestRegistry,
	fireEvent,
	render,
	provideUserInfo,
} from '../../../../../../tests/js/test-utils';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
import PublicationCreate from './PublicationCreate';

describe( 'PublicationCreate', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
	} );

	it( 'should render first step correctly when no publication is available', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [] );

		const { container, getByRole, waitForRegistry } = render(
			<PublicationCreate onCompleteSetup={ () => {} } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'To complete your Reader Revenue Manager account setup you will need to create a publication.'
		);
		expect( container ).toHaveTextContent(
			'Once you have created your publication, it is submitted for review.'
		);

		expect(
			getByRole( 'button', {
				name: /create publication/i,
			} )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: /create publication/i,
			} )
		).toHaveAttribute(
			'href',
			registry.select( MODULES_READER_REVENUE_MANAGER ).getServiceURL()
		);
	} );

	it( 'should render second step correctly when publication is available', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		const { container, getByRole, waitForRegistry } = render(
			<PublicationCreate onCompleteSetup={ () => {} } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'You have successfully created your publication and it is now awaiting review. This might take up to 2 weeks.'
		);

		expect(
			getByRole( 'button', {
				name: /complete setup/i,
			} )
		).toBeInTheDocument();
	} );

	it( 'should call onCompleteSetup when clicking the "Complete setup" button', async () => {
		const onCompleteSetupMock = jest.fn();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		const { getByRole, waitForRegistry } = render(
			<PublicationCreate onCompleteSetup={ onCompleteSetupMock } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const completeSetupButton = getByRole( 'button', {
			name: /complete setup/i,
		} );

		expect( completeSetupButton ).toBeInTheDocument();

		fireEvent.click( completeSetupButton );

		// Verify the onCompleteSetup function was called.
		expect( onCompleteSetupMock ).toHaveBeenCalledTimes( 1 );
	} );
} );
