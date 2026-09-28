/**
 * CategoryFilterChips component tests.
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
import { fireEvent, render, screen } from '@tests/js/test-utils';
import CategoryFilterChips from './CategoryFilterChips';

function expectSelected( label: string, selected = true ) {
	const chip = screen.getByText( label ).closest( '.mdc-chip' ) as Element;

	expect( chip ).not.toBeNull();
	expect( chip.classList.contains( 'mdc-chip--selected' ) ).toBe( selected );
}

describe( 'CategoryFilterChips', () => {
	it( 'should have All services selected by default', () => {
		render(
			<CategoryFilterChips
				onToggleCategory={ () => {} }
				selectedCategories={ [] }
			/>
		);

		expectSelected( 'All services' );
		expectSelected( 'Know your audience', false );
	} );

	it( 'should call onToggleCategory with category slug when selecting a category', () => {
		const onToggleCategory = jest.fn();

		render(
			<CategoryFilterChips
				onToggleCategory={ onToggleCategory }
				selectedCategories={ [] }
			/>
		);

		fireEvent.click( screen.getByText( 'Know your audience' ) );

		expect( onToggleCategory ).toHaveBeenCalledWith( 'audience' );
	} );

	it( 'should render selected state for multiple selected categories', () => {
		render(
			<CategoryFilterChips
				onToggleCategory={ () => {} }
				selectedCategories={ [ 'audience', 'monetization' ] }
			/>
		);

		expectSelected( 'All services', false );
		expectSelected( 'Know your audience' );
		expectSelected( 'Monetize' );
	} );

	it( 'should call onToggleCategory with null when clicking All services', () => {
		const onToggleCategory = jest.fn();

		render(
			<CategoryFilterChips
				onToggleCategory={ onToggleCategory }
				selectedCategories={ [ 'audience' ] }
			/>
		);

		fireEvent.click( screen.getByText( 'All services' ) );

		expect( onToggleCategory ).toHaveBeenCalledWith( null );
	} );
} );
