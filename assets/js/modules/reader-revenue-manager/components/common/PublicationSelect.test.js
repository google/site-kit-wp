/**
 * Publication Select component tests.
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
	createTestRegistry,
	fireEvent,
	render,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';

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
			// eslint-disable-next-line sitekit/acronym-case
			publications[ 0 ].publicationId
		);
	} );

	it( 'should render select if the publication ID is invalid.', async () => {
		// Set the invalid publication ID.
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationID( 'ABCD*&^' );

		const { container, waitForRegistry } = render( <PublicationSelect />, {
			registry,
		} );

		await waitForRegistry();

		// After we set a valid publication ID, the publication select should be visible.
		expect( container.querySelector( '.mdc-select' ) ).toBeInTheDocument();
	} );

	it( 'should render an option for each publication.', async () => {
		const { getAllByRole, waitForRegistry } = render(
			<PublicationSelect />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( publications.length );
	} );

	it( 'should disable the publication select if the user does not have module access', async () => {
		const { container, getAllByRole, waitForRegistry } = render(
			<PublicationSelect hasModuleAccess={ false } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );

		// Verify that the publication select dropdown is disabled.
		expect(
			container.querySelector( '.mdc-select--disabled' )
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'PQRSTUV', 'PENDING_VERIFICATION', 1 ],
		[ 'IJKLMNOP', 'ONBOARDING_ACTION_REQUIRED', 2 ],
	] )(
		'should update publication ID to %s and onboarding state to %s in the store when a new item is selected with index %s',
		async ( publicationID, onboardingState, index ) => {
			const { container, getAllByRole, waitForRegistry } = render(
				<PublicationSelect />,
				{
					registry,
				}
			);

			await waitForRegistry();

			// Click the label to expose the elements in the menu.
			fireEvent.click( container.querySelector( '.mdc-floating-label' ) );
			// Click this element to select it and fire the onChange event.
			fireEvent.click(
				getAllByRole( 'menuitem', { hidden: true } )[ index ]
			);

			const newPublicationID = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationID();

			const newOnboardingState = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationOnboardingState();

			expect( publicationID ).toEqual( newPublicationID );
			expect( onboardingState ).toEqual( newOnboardingState );
		}
	);
} );
