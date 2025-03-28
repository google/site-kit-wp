/**
 * Product ID Select component tests.
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
import ProductIDSelect from './ProductIDSelect';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../../../tests/js/test-utils';

describe( 'ProductIDSelect', () => {
	let registry;
	const productIDs = [ 'product-1', 'product-2' ];

	beforeEach( () => {
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				productID: 'product-1',
				productIDs,
			} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
	} );

	it( 'should render a select field', async () => {
		const { container, waitForRegistry } = render( <ProductIDSelect />, {
			registry,
		} );

		await waitForRegistry();

		expect( container.querySelector( '.mdc-select' ) ).toBeInTheDocument();
	} );

	it( 'should render an option for each product ID', async () => {
		const { getAllByRole, waitForRegistry } = render( <ProductIDSelect />, {
			registry,
		} );

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );

		listItems.forEach( ( listItem ) => {
			const value = listItem.dataset.value;
			const expectedText = value === 'openaccess' ? 'Open access' : value;
			expect( listItem.textContent ).toEqual( expectedText );
		} );
	} );

	it( 'should disable the product ID select if the user does not have module access', async () => {
		const { container, getAllByRole, waitForRegistry } = render(
			<ProductIDSelect hasModuleAccess={ false } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems ).toHaveLength( 1 );

		expect( listItems[ 0 ].textContent ).toEqual( 'product-1' );

		// Verify that the product ID select dropdown is disabled.
		expect(
			container.querySelector( '.mdc-select--disabled' )
		).toBeInTheDocument();
	} );

	it( 'should set the product ID in state when one is selected', async () => {
		const { container, getAllByRole, waitForRegistry } = render(
			<ProductIDSelect />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Click the label to expose the elements in the menu.
		fireEvent.click( container.querySelector( '.mdc-floating-label' ) );

		const listItems = getAllByRole( 'menuitem', { hidden: true } );

		listItems.forEach( ( listItem ) => {
			fireEvent.click( listItem );

			const expectedValue = listItem.dataset.value;
			expect(
				registry.select( MODULES_READER_REVENUE_MANAGER ).getProductID()
			).toEqual( expectedValue );
		} );
	} );

	it( 'should render "Open access" as the first option', async () => {
		const { getAllByRole, waitForRegistry } = render( <ProductIDSelect />, {
			registry,
		} );

		await waitForRegistry();

		const listItems = getAllByRole( 'menuitem', { hidden: true } );
		expect( listItems[ 0 ].textContent ).toEqual( 'Open access' );
	} );

	// Test the helper text.
	it( 'should render the helper text if showHelperText is true', async () => {
		const { getByText, waitForRegistry } = render( <ProductIDSelect />, {
			registry,
		} );

		const helperText = getByText(
			'Product IDs offer a way to link content to payment plans.'
		);

		await waitForRegistry();
		expect( helperText ).toBeInTheDocument();
	} );

	it( 'should not render the helper text if showHelperText is false', async () => {
		const { queryByText, waitForRegistry } = render(
			<ProductIDSelect showHelperText={ false } />,
			{ registry }
		);

		await waitForRegistry();
		expect(
			queryByText(
				'Product IDs offer a way to link content to payment plans.'
			)
		).not.toBeInTheDocument();
	} );
} );
