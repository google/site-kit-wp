/**
 * FrequencySelector component tests.
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
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../tests/js/test-utils';
import { provideSiteInfo } from '../../../../tests/js/utils';
import FrequencySelector from './FrequencySelector';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

function setupRegistry(
	registry,
	{ startOfWeek = 1, frequency, savedFrequency } = {}
) {
	provideSiteInfo( registry, { startOfWeek } );

	if ( savedFrequency ) {
		registry
			.dispatch( CORE_USER )
			.receiveGetProactiveUserEngagementSettings( {
				frequency: savedFrequency,
			} );
	}

	if ( frequency ) {
		registry
			.dispatch( CORE_USER )
			.setProactiveUserEngagementFrequency( frequency );
	}
}

function renderSelector( registry, props = {} ) {
	const view = render(
		<div style={ { maxWidth: 920 } }>
			<FrequencySelector { ...props } />
		</div>,
		{ registry }
	);

	const containerElement = document.querySelector(
		'.googlesitekit-frequency-selector'
	);

	return { ...view, containerElement };
}

describe( 'FrequencySelector', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'Story states (visual + DOM)', () => {
		it( 'Weekly selected (default Monday) renders and matches snapshot', () => {
			setupRegistry( registry, { startOfWeek: 1, frequency: 'weekly' } );

			const { containerElement } = renderSelector( registry );
			expect( containerElement ).toBeInTheDocument();

			expect( containerElement ).toMatchSnapshot();
		} );

		it( 'Monthly selected renders and matches snapshot', () => {
			setupRegistry( registry, { startOfWeek: 1, frequency: 'monthly' } );

			const { containerElement } = renderSelector( registry );
			expect( containerElement ).toBeInTheDocument();

			expect( containerElement ).toMatchSnapshot();
		} );

		it( 'Quarterly selected renders and matches snapshot', () => {
			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'quarterly',
			} );

			const { containerElement } = renderSelector( registry );
			expect( containerElement ).toBeInTheDocument();

			expect( containerElement ).toMatchSnapshot();
		} );

		it( 'Weekly selected with Sunday start shows "Sent every Sunday" and matches snapshot', () => {
			setupRegistry( registry, { startOfWeek: 0, frequency: 'weekly' } );

			const { containerElement, getByText } = renderSelector( registry );

			expect( getByText( /Sent every Sunday/i ) ).toBeInTheDocument();

			expect( containerElement ).toMatchSnapshot();
		} );

		it( 'Previously saved frequency (saved monthly, current weekly) indicates saved on monthly only and matches snapshot', () => {
			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'weekly',
				savedFrequency: 'monthly',
			} );

			const { containerElement, getByText } = renderSelector( registry, {
				isUserSubscribed: true,
			} );

			const indicators = containerElement.querySelectorAll(
				'.googlesitekit-frequency-selector__saved-indicator'
			);
			expect( indicators.length ).toBe( 1 );

			const monthlyLabel = getByText( 'Monthly' );
			const monthlyCard = monthlyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect( monthlyCard ).toBeTruthy();
			expect(
				monthlyCard.querySelector(
					'.googlesitekit-frequency-selector__saved-indicator'
				)
			).toBeInTheDocument();

			const weeklyLabel = getByText( 'Weekly' );
			const weeklyCard = weeklyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect(
				weeklyCard.querySelector(
					'.googlesitekit-frequency-selector__saved-indicator'
				)
			).not.toBeInTheDocument();

			const quarterlyLabel = getByText( 'Quarterly' );
			const quarterlyCard = quarterlyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect(
				quarterlyCard.querySelector(
					'.googlesitekit-frequency-selector__saved-indicator'
				)
			).not.toBeInTheDocument();

			expect( containerElement ).toMatchSnapshot();
		} );

		it( 'Previously saved frequency (same as the current frequency) shows saved indicator on selected card and matches snapshot', () => {
			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'monthly',
				savedFrequency: 'monthly',
			} );

			const { containerElement, getByText } = renderSelector( registry, {
				isUserSubscribed: true,
			} );

			const monthlyLabel = getByText( 'Monthly' );
			const monthlyCard = monthlyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect( monthlyCard ).toBeTruthy();

			expect(
				monthlyCard.querySelector(
					'.googlesitekit-frequency-selector__saved-indicator'
				)
			).toBeInTheDocument();

			expect(
				monthlyCard.classList.contains(
					'googlesitekit-frequency-selector__card--selected'
				)
			).toBe( true );
			expect( monthlyCard.getAttribute( 'aria-checked' ) ).toBe( 'true' );

			expect( containerElement ).toMatchSnapshot();
		} );
	} );

	describe( 'Interactions', () => {
		it( 'Clicking a non-selected card updates store and UI selection', () => {
			setupRegistry( registry, { startOfWeek: 1, frequency: 'weekly' } );

			const { getByText } = renderSelector( registry );

			const monthlyLabel = getByText( 'Monthly' );
			const monthlyCard = monthlyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect( monthlyCard ).toBeTruthy();

			expect(
				monthlyCard.classList.contains(
					'googlesitekit-frequency-selector__card--selected'
				)
			).toBe( false );
			expect( monthlyCard.getAttribute( 'aria-checked' ) ).toBe(
				'false'
			);

			// Click to select.
			fireEvent.click( monthlyCard );

			// Store should reflect selection.
			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementFrequency()
			).toBe( 'monthly' );

			// UI should update selection state.
			expect(
				monthlyCard.classList.contains(
					'googlesitekit-frequency-selector__card--selected'
				)
			).toBe( true );
			expect( monthlyCard.getAttribute( 'aria-checked' ) ).toBe( 'true' );
		} );

		it( 'Pressing Enter on a non-selected card updates store (keyboard accessibility)', () => {
			setupRegistry( registry, { startOfWeek: 1, frequency: 'weekly' } );

			const { getByText } = renderSelector( registry );

			const quarterlyLabel = getByText( 'Quarterly' );
			const quarterlyCard = quarterlyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect( quarterlyCard ).toBeTruthy();

			// KeyDown Enter.
			fireEvent.keyDown( quarterlyCard, { key: 'Enter' } );

			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementFrequency()
			).toBe( 'quarterly' );
			expect( quarterlyCard.getAttribute( 'aria-checked' ) ).toBe(
				'true'
			);
		} );

		it( 'Pressing Space on a non-selected card updates store (keyboard accessibility)', () => {
			setupRegistry( registry, { startOfWeek: 1, frequency: 'monthly' } );

			const { getByText } = renderSelector( registry );

			const weeklyLabel = getByText( 'Weekly' );
			const weeklyCard = weeklyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect( weeklyCard ).toBeTruthy();

			// KeyDown Space.
			fireEvent.keyDown( weeklyCard, { key: ' ' } );

			expect(
				registry
					.select( CORE_USER )
					.getProactiveUserEngagementFrequency()
			).toBe( 'weekly' );
			expect( weeklyCard.getAttribute( 'aria-checked' ) ).toBe( 'true' );
		} );
	} );
} );
