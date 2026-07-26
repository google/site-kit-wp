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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import FrequencySelector from './FrequencySelector';

// Aug 1, 2026 09:00 UTC — used as a stand-in for a backend-computed next
// report timestamp that should display as "Aug 1, 2026".
const AUG_1_2026_TIMESTAMP = Date.UTC( 2026, 7, 1, 9, 0, 0 ) / 1000;

function setupRegistry(
	registry,
	{
		startOfWeek = 1,
		frequency,
		savedFrequency,
		// Default to a falsy timestamp so the "Next report" line stays
		// hidden unless a test explicitly provides one. This also
		// pre-populates the store so tests don't trigger a real network
		// request for the (mocked) next report endpoint.
		nextReportTimestamp = 0,
	} = {}
) {
	provideSiteInfo( registry, { startOfWeek } );

	registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
		enabled: true,
	} );

	if ( savedFrequency ) {
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			frequency: savedFrequency,
		} );
	}

	if ( frequency ) {
		registry.dispatch( CORE_USER ).setEmailReportingFrequency( frequency );
	}

	registry.dispatch( CORE_USER ).receiveGetEmailReportingNextReport( {
		timestamp: nextReportTimestamp,
	} );
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
		global.innerWidth = 1024;
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

		it( 'Previously saved frequency (saved monthly, current weekly) shows current subscription pill above monthly card and matches snapshot', () => {
			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'weekly',
				savedFrequency: 'monthly',
				nextReportTimestamp: AUG_1_2026_TIMESTAMP,
			} );

			const { container, containerElement, getByText } = renderSelector(
				registry,
				{
					isUserSubscribed: true,
				}
			);

			// Check that there's exactly one current subscription pill.
			const pills = container.querySelectorAll(
				'.googlesitekit-frequency-selector__current-subscription'
			);
			expect( pills.length ).toBe( 1 );

			// Check that the badge row exists and contains the pill.
			const badgeRow = container.querySelector(
				'.googlesitekit-frequency-selector__badge-row'
			);
			expect( badgeRow ).toBeInTheDocument();
			expect(
				badgeRow.querySelector(
					'.googlesitekit-frequency-selector__current-subscription'
				)
			).toBeInTheDocument();

			// Check that the pill text is correct.
			expect( getByText( 'Current subscription' ) ).toBeInTheDocument();
			expect(
				getByText( 'Next report: Aug 1, 2026' )
			).toBeInTheDocument();

			// Check that the "Current subscription" label has its own
			// styling hook class (distinct from the "Next report" line),
			// so it can be styled independently (e.g. its font weight).
			expect( getByText( 'Current subscription' ) ).toHaveClass(
				'googlesitekit-frequency-selector__current-subscription-label'
			);

			expect( containerElement ).toMatchSnapshot();
		} );

		it( 'Previously saved frequency (same as the current frequency) shows current subscription pill above selected card and matches snapshot', () => {
			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'monthly',
				savedFrequency: 'monthly',
				nextReportTimestamp: AUG_1_2026_TIMESTAMP,
			} );

			const { container, containerElement, getByText } = renderSelector(
				registry,
				{
					isUserSubscribed: true,
				}
			);

			// Check that there's exactly one current subscription pill in the badge row.
			const badgeRow = container.querySelector(
				'.googlesitekit-frequency-selector__badge-row'
			);
			expect( badgeRow ).toBeInTheDocument();
			expect(
				badgeRow.querySelector(
					'.googlesitekit-frequency-selector__current-subscription'
				)
			).toBeInTheDocument();

			// Check that the monthly card is selected.
			const monthlyLabel = getByText( 'Monthly' );
			const monthlyCard = monthlyLabel.closest(
				'.googlesitekit-frequency-selector__card'
			);
			expect(
				monthlyCard.classList.contains(
					'googlesitekit-frequency-selector__card--selected'
				)
			).toBe( true );
			expect( monthlyCard.getAttribute( 'aria-checked' ) ).toBe( 'true' );
			expect(
				getByText( 'Next report: Aug 1, 2026' )
			).toBeInTheDocument();

			expect( containerElement ).toMatchSnapshot();
		} );

		it( 'Does not show the current subscription pill on desktop when the user is not subscribed', () => {
			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'weekly',
				savedFrequency: 'monthly',
				nextReportTimestamp: AUG_1_2026_TIMESTAMP,
			} );

			const { container, queryByText } = renderSelector( registry, {
				isUserSubscribed: false,
			} );

			expect(
				container.querySelector(
					'.googlesitekit-frequency-selector__badge-row'
				)
			).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-frequency-selector__current-subscription'
				)
			).not.toBeInTheDocument();
			expect( queryByText( 'Current subscription' ) ).toBeNull();
			expect( queryByText( 'Next report: Aug 1, 2026' ) ).toBeNull();
		} );

		it( 'Does not show the current subscription pill on mobile when the user is not subscribed', () => {
			global.innerWidth = 500;

			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'weekly',
				savedFrequency: 'monthly',
				nextReportTimestamp: AUG_1_2026_TIMESTAMP,
			} );

			const { container, queryByText } = renderSelector( registry, {
				isUserSubscribed: false,
			} );

			expect(
				container.querySelector(
					'.googlesitekit-frequency-selector__current-subscription'
				)
			).not.toBeInTheDocument();
			expect( queryByText( 'Next report: Aug 1, 2026' ) ).toBeNull();
		} );

		it( 'Renders next report date in the mobile current subscription pill', () => {
			global.innerWidth = 500;

			setupRegistry( registry, {
				startOfWeek: 1,
				frequency: 'weekly',
				savedFrequency: 'monthly',
				nextReportTimestamp: AUG_1_2026_TIMESTAMP,
			} );

			const { container, getByText, getByRole } = renderSelector(
				registry,
				{
					isUserSubscribed: true,
				}
			);

			expect(
				container.querySelector(
					'.googlesitekit-frequency-selector__badge-row'
				)
			).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-frequency-selector__current-subscription'
				)
			).toBeInTheDocument();
			expect(
				getByText( 'Next report: Aug 1, 2026' )
			).toBeInTheDocument();

			// Accessible name must stay the frequency label only, even when the
			// current-subscription pill (with next report date) is nested in
			// the card on mobile.
			expect(
				getByRole( 'radio', { name: 'Monthly' } )
			).toHaveAccessibleName( 'Monthly' );
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
				registry.select( CORE_USER ).getEmailReportingFrequency()
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
				registry.select( CORE_USER ).getEmailReportingFrequency()
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
				registry.select( CORE_USER ).getEmailReportingFrequency()
			).toBe( 'weekly' );
			expect( weeklyCard.getAttribute( 'aria-checked' ) ).toBe( 'true' );
		} );
	} );
} );
