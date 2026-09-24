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
 * External dependencies
 */
import { FC, useState } from 'react';

/**
 * Internal dependencies
 */
import type { FeatureCategorySlug } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { fireEvent, render, screen } from '@tests/js/test-utils';
import CategoryFilterChips from './CategoryFilterChips';

interface TestHarnessProps {
	initialSelection?: FeatureCategorySlug[];
}

const TestHarness: FC< TestHarnessProps > = ( { initialSelection = [] } ) => {
	const [ selectedCategories, setSelectedCategories ] =
		useState< FeatureCategorySlug[] >( initialSelection );

	function onToggleCategory( categorySlug: FeatureCategorySlug | null ) {
		if ( categorySlug === null ) {
			setSelectedCategories( [] );
			return;
		}

		setSelectedCategories( ( currentSelection ) => {
			if ( currentSelection.includes( categorySlug ) ) {
				return currentSelection.filter(
					( category ) => category !== categorySlug
				);
			}

			return [ ...currentSelection, categorySlug ];
		} );
	}

	return (
		<CategoryFilterChips
			onToggleCategory={ onToggleCategory }
			selectedCategories={ selectedCategories }
		/>
	);
};

function expectSelected( label: string, selected = true ) {
	const chip = screen.getByText( label ).closest( '.mdc-chip' ) as Element;

	expect( chip ).not.toBeNull();
	expect( chip.classList.contains( 'mdc-chip--selected' ) ).toBe( selected );
}

describe( 'CategoryFilterChips', () => {
	it( 'should have All services selected by default', () => {
		render( <TestHarness /> );

		expectSelected( 'All services' );
		expectSelected( 'Know your audience', false );
	} );

	it( 'should clear All services when selecting a category', () => {
		render( <TestHarness /> );

		fireEvent.click( screen.getByText( 'Know your audience' ) );

		expectSelected( 'All services', false );
		expectSelected( 'Know your audience' );
	} );

	it( 'should allow selecting multiple categories', () => {
		render( <TestHarness /> );

		fireEvent.click( screen.getByText( 'Know your audience' ) );
		fireEvent.click( screen.getByText( 'Monetize' ) );

		expectSelected( 'Know your audience' );
		expectSelected( 'Monetize' );
		expectSelected( 'All services', false );
	} );

	it( 'should return to All services when deselecting the last selected category', () => {
		render( <TestHarness initialSelection={ [ 'audience' ] } /> );

		fireEvent.click( screen.getByText( 'Know your audience' ) );

		expectSelected( 'All services' );
		expectSelected( 'Know your audience', false );
	} );

	it( 'should clear selected categories when clicking All services', () => {
		render(
			<TestHarness initialSelection={ [ 'audience', 'monetization' ] } />
		);

		fireEvent.click( screen.getByText( 'All services' ) );

		expectSelected( 'All services' );
		expectSelected( 'Know your audience', false );
		expectSelected( 'Monetize', false );
	} );
} );
