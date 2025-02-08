/**
 * Snippet Mode Select component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import SnippetModeSelect from './SnippetModeSelect';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { SNIPPET_MODES } from '../../constants';
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../../../tests/js/test-utils';

describe( 'SnippetModeSelect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				snippetMode: 'post_types',
			} );
	} );

	it( 'should render a select field', async () => {
		const { container, waitForRegistry } = render( <SnippetModeSelect />, {
			registry,
		} );

		await waitForRegistry();

		expect( container.querySelector( '.mdc-select' ) ).toBeInTheDocument();
	} );

	it( 'should render an option for each snippet mode', async () => {
		const { getAllByRole, waitForRegistry } = render(
			<SnippetModeSelect />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( Object.keys( SNIPPET_MODES ).length );

		listItems.forEach( ( listItem, index ) => {
			// Assert that data-value of listItem is equal to the snippet mode.
			expect( listItem.dataset.value ).toBe(
				Object.keys( SNIPPET_MODES )[ index ]
			);

			expect( listItem.textContent ).toEqual(
				SNIPPET_MODES[ listItem.dataset.value ]
			);
		} );
	} );

	it( 'should disable the snippet mode select if the user does not have module access', async () => {
		const { container, getAllByRole, waitForRegistry } = render(
			<SnippetModeSelect hasModuleAccess={ false } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );

		// Verify that the snippet mode select dropdown is disabled.
		expect(
			container.querySelector( '.mdc-select--disabled' )
		).toBeInTheDocument();
	} );

	it( 'should set the snippet mode in state when one is selected', async () => {
		const { container, getAllByRole, waitForRegistry } = render(
			<SnippetModeSelect />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );

		Object.keys( SNIPPET_MODES ).forEach( ( mode, index ) => {
			fireEvent.click(
				getAllByRole( 'menuitem', { hidden: true } )[ index ]
			);

			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSnippetMode()
			).toEqual( mode );
		} );
	} );
} );
