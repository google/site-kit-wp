/**
 * GA4 Publicaion Select component tests.
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
import PublicationSelect from './PublicationSelect';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';

/* eslint-disable sitekit/acronym-case */
describe( 'PublicationSelect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		const { dispatch } = registry;

		provideUserAuthentication( registry );

		dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetPublications(
			publications
		);

		dispatch( MODULES_READER_REVENUE_MANAGER ).setPublicationID(
			publications[ 0 ].publicationId
		);
	} );

	it( 'should return null if the publication ID is invalid.', async () => {
		// Set the invalid publication ID.
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationID( 'ABCD*&^' );

		const { container, waitForRegistry } = render(
			<PublicationSelect isDisabled={ false } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Component must return `null` for invalid publication ID.
		expect( container.firstChild ).toBeNull();
		expect( container ).toBeEmptyDOMElement();

		act( () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPublicationID( publications[ 0 ].publicationId );
		} );

		// After we set a valid publication ID, the publication select should be visible.
		expect(
			container.querySelector(
				'.googlesitekit-analytics-4__select-publication'
			)
		).toBeInTheDocument();

		expect(
			container.querySelector( '.mdc-select__selected-text' )
		).toBeInTheDocument();
	} );

	it( 'should render an option for each publication.', async () => {
		const { getAllByRole, waitForRegistry } = render(
			<PublicationSelect isDisabled={ false } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( publications.length );
	} );

	it( 'should disable the public select if the user does not have module access', async () => {
		const { container, getAllByRole, waitForRegistry } = render(
			<PublicationSelect
				isDisabled={ false }
				hasModuleAccess={ false }
			/>,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );

		// Verify that the Publication select dropdown is disabled.
		[
			'.googlesitekit-analytics-4__select-publication',
			'.mdc-select--disabled',
		].forEach( ( className ) => {
			expect( container.querySelector( className ) ).toBeInTheDocument();
		} );
	} );

	it( 'should update publicationID in the store when a new item is selected', async () => {
		const { container, getAllByRole, waitForRegistry } = render(
			<PublicationSelect isDisabled={ false } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const targetPublication = publications[ 1 ].publicationId;

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
		// Click this element to select it and fire the onChange event.
		fireEvent.click( getAllByRole( 'menuitem', { hidden: true } )[ 1 ] );

		const newPublicationID = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationID();
		expect( targetPublication ).toEqual( newPublicationID );
	} );
} );
