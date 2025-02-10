/**
 * Post Types Select component tests.
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
import PostTypesSelect from './PostTypesSelect';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	render,
} from '../../../../../../tests/js/test-utils';

describe( 'PostTypesSelect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry, {
			postTypes: [
				{ slug: 'post', label: 'Posts' },
				{ slug: 'page', label: 'Pages' },
				{ slug: 'products', label: 'Products' },
			],
		} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				postTypes: [ '' ],
			} );
	} );

	it( 'should render a chip multi-select field', async () => {
		const { container, waitForRegistry } = render( <PostTypesSelect />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-chip-multi-select' )
		).toBeInTheDocument();
	} );

	it( 'should render an option for each post type', async () => {
		const { container, waitForRegistry } = render( <PostTypesSelect />, {
			registry,
		} );

		await waitForRegistry();

		const listItems = container.querySelectorAll(
			'.googlesitekit-chip-multi-select__item'
		);

		const allPostTypes = registry.select( CORE_SITE ).getPostTypes();

		expect( listItems ).toHaveLength( allPostTypes.length );

		listItems.forEach( ( listItem, index ) => {
			// Assert that data-chip-id of listItem is equal to the post type slug.
			// eslint-disable-next-line sitekit/acronym-case
			expect( listItem.dataset.chipId ).toBe(
				allPostTypes[ index ].slug
			);

			expect(
				listItem.querySelector( '.mdc-chip__text' ).textContent
			).toEqual( allPostTypes[ index ].label );
		} );
	} );

	it( 'should disable the post types select if the user does not have module access', async () => {
		const { container, waitForRegistry } = render(
			<PostTypesSelect hasModuleAccess={ false } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const listItems = container.querySelectorAll(
			'.googlesitekit-chip-multi-select__item'
		);

		listItems.forEach( ( listItem ) => {
			expect( listItem ).toHaveClass( 'googlesitekit-chip--disabled' );
		} );
	} );
} );
