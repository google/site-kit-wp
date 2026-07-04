/**
 * WidgetDismissTransition component tests.
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
import { act, render } from '@tests/js/test-utils';
import WidgetDismissTransition, {
	DISMISS_TRANSITION_MS,
} from './WidgetDismissTransition';

describe( 'WidgetDismissTransition', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'returns null content for children while isDismissing is undefined (loading)', () => {
		const { container } = render(
			<WidgetDismissTransition
				isDismissing={ undefined }
				isDismissed={ false }
			>
				<span data-testid="child">child</span>
			</WidgetDismissTransition>
		);

		// Wrapper renders, children render, but no dismissing class.
		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).toBeNull();
	} );

	it( 'returns null content (no dismissing) while isDismissed is undefined (loading)', () => {
		const { container } = render(
			<WidgetDismissTransition isDismissed={ undefined } isDismissing>
				<span>child</span>
			</WidgetDismissTransition>
		);

		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).toBeNull();
	} );

	it( 'transitions visible → dismissing → hidden on the success path', () => {
		const onDismissComplete = jest.fn();
		const { container, rerender } = render(
			<WidgetDismissTransition
				isDismissing={ false }
				isDismissed={ false }
				onDismissComplete={ onDismissComplete }
			>
				<span data-testid="child">child</span>
			</WidgetDismissTransition>
		);

		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).toBeNull();
		expect( container.textContent ).toContain( 'child' );

		// Click happens, isDismissing flips true.
		rerender(
			<WidgetDismissTransition
				isDismissed={ false }
				onDismissComplete={ onDismissComplete }
				isDismissing
			>
				<span data-testid="child">child</span>
			</WidgetDismissTransition>
		);

		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).not.toBeNull();
		expect( onDismissComplete ).not.toHaveBeenCalled();

		// Request resolves successfully.
		rerender(
			<WidgetDismissTransition
				isDismissing={ false }
				onDismissComplete={ onDismissComplete }
				isDismissed
			>
				<span data-testid="child">child</span>
			</WidgetDismissTransition>
		);

		// Still in dismissing phase until timer fires.
		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).not.toBeNull();
		expect( onDismissComplete ).not.toHaveBeenCalled();

		act( () => {
			jest.advanceTimersByTime( DISMISS_TRANSITION_MS );
		} );

		expect( onDismissComplete ).toHaveBeenCalledTimes( 1 );
		expect( onDismissComplete ).toHaveBeenCalledWith();
		// Phase is hidden; children no longer render.
		expect( container.textContent ).not.toContain( 'child' );
	} );

	it( 'restores to visible (no onDismissComplete) on the failure path', () => {
		const onDismissComplete = jest.fn();
		const { container, rerender } = render(
			<WidgetDismissTransition
				isDismissed={ false }
				onDismissComplete={ onDismissComplete }
				isDismissing
			>
				<span data-testid="child">child</span>
			</WidgetDismissTransition>
		);

		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).not.toBeNull();

		// Request resolves with failure (isDismissed remains false).
		rerender(
			<WidgetDismissTransition
				isDismissing={ false }
				isDismissed={ false }
				onDismissComplete={ onDismissComplete }
			>
				<span data-testid="child">child</span>
			</WidgetDismissTransition>
		);

		act( () => {
			jest.advanceTimersByTime( DISMISS_TRANSITION_MS );
		} );

		expect( onDismissComplete ).not.toHaveBeenCalled();
		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).toBeNull();
		expect( container.textContent ).toContain( 'child' );
	} );

	it( 'fires onDismissComplete exactly once even after subsequent re-renders', () => {
		const onDismissComplete = jest.fn();
		const { rerender } = render(
			<WidgetDismissTransition
				isDismissed={ false }
				onDismissComplete={ onDismissComplete }
				isDismissing
			>
				<span>child</span>
			</WidgetDismissTransition>
		);

		rerender(
			<WidgetDismissTransition
				isDismissing={ false }
				onDismissComplete={ onDismissComplete }
				isDismissed
			>
				<span>child</span>
			</WidgetDismissTransition>
		);

		act( () => {
			jest.advanceTimersByTime( DISMISS_TRANSITION_MS );
		} );

		expect( onDismissComplete ).toHaveBeenCalledTimes( 1 );

		// Re-render with the same dismissed state.
		rerender(
			<WidgetDismissTransition
				isDismissing={ false }
				onDismissComplete={ onDismissComplete }
				isDismissed
			>
				<span>child</span>
			</WidgetDismissTransition>
		);

		act( () => {
			jest.advanceTimersByTime( DISMISS_TRANSITION_MS );
		} );

		expect( onDismissComplete ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'defers completion until isDismissing resolves on the slow-network path', () => {
		const onDismissComplete = jest.fn();
		const { container, rerender } = render(
			<WidgetDismissTransition
				isDismissed={ false }
				onDismissComplete={ onDismissComplete }
				isDismissing
			>
				<span>child</span>
			</WidgetDismissTransition>
		);

		// Timer fires while the request is still in flight.
		act( () => {
			jest.advanceTimersByTime( DISMISS_TRANSITION_MS );
		} );

		// Phase remains dismissing; onDismissComplete has not fired.
		expect(
			container.querySelector(
				'.googlesitekit-widget-dismiss-transition--dismissing'
			)
		).not.toBeNull();
		expect( onDismissComplete ).not.toHaveBeenCalled();

		// Request finally resolves successfully much later.
		rerender(
			<WidgetDismissTransition
				isDismissing={ false }
				onDismissComplete={ onDismissComplete }
				isDismissed
			>
				<span>child</span>
			</WidgetDismissTransition>
		);

		expect( onDismissComplete ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'clears the timer on unmount without warnings', () => {
		const onDismissComplete = jest.fn();
		const { unmount } = render(
			<WidgetDismissTransition
				isDismissed={ false }
				onDismissComplete={ onDismissComplete }
				isDismissing
			>
				<span>child</span>
			</WidgetDismissTransition>
		);

		unmount();

		act( () => {
			jest.advanceTimersByTime( DISMISS_TRANSITION_MS * 2 );
		} );

		expect( onDismissComplete ).not.toHaveBeenCalled();
	} );
} );
