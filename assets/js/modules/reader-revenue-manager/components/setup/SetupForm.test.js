/**
 * Reader Revenue Manager SetupForm component tests.
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
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import {
	createTestRegistry,
	provideModules,
} from '../../../../../../tests/js/utils';
import {
	act,
	fireEvent,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import { publications } from '../../datastore/__fixtures__';
import SetupForm from './SetupForm';

describe( 'SetupForm', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {} );
	} );

	it( 'should render the form correctly', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		const { container, getByRole, getByText, waitForRegistry } = render(
			<SetupForm onCompleteSetup={ () => {} } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( 'Publication' ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: /create new publication/i } )
		).toBeInTheDocument();
	} );

	it( 'should change instruction text based on number of publications', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [ publications[ 0 ] ] );

		const { getByText, waitForRegistry } = render(
			<SetupForm onCompleteSetup={ () => {} } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText( 'Site Kit will connect your existing publication' )
		).toBeInTheDocument();

		await act( () =>
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetPublications( publications )
		);

		await waitForRegistry();

		expect(
			getByText(
				'Select your preferred publication to connect with Site Kit'
			)
		).toBeInTheDocument();
	} );

	it( 'should automatically find and select a matched publication', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		const matchedPublication = await registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.findMatchedPublication();

		expect(
			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
		).toBeUndefined();

		const { waitForRegistry } = render(
			<SetupForm onCompleteSetup={ () => {} } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
			// eslint-disable-next-line sitekit/acronym-case
		).toEqual( matchedPublication.publicationId );
	} );

	it( 'should submit the form upon pressing the CTA', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		const onCompleteSetup = jest.fn();

		const { getByRole, waitForRegistry } = render(
			<SetupForm onCompleteSetup={ onCompleteSetup } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		act( () => {
			fireEvent.click(
				getByRole( 'button', { name: /Complete setup/i } )
			);
		} );

		await waitFor( () => {
			expect( onCompleteSetup ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	it( 'should render the product ID setting', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				ownerID: 1,
				// eslint-disable-next-line sitekit/acronym-case
				publicationID: publications[ 0 ].publicationId,
				productIDs: [ 'product-1', 'product-2' ],
			} );

		const onCompleteSetup = jest.fn();

		const { getByText, waitForRegistry } = render(
			<SetupForm onCompleteSetup={ onCompleteSetup } />,
			{
				registry,
				features: [ 'rrmModuleV2' ],
			}
		);

		await waitForRegistry();

		expect( getByText( 'Default Product ID' ) ).toBeInTheDocument();
	} );
} );
