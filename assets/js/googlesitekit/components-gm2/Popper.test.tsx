/**
 * Popper component tests.
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
import { FC, Fragment } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { act, fireEvent, render } from '../../../../tests/js/test-utils';
import Popper from './Popper';

interface HarnessProps {
	autoDismissMs?: number;
	resetKey?: number | string;
	className?: string;
}

// Uses a ref callback so React sets `anchorEl` after mount, which opens the popper right away.
const PopperHarness: FC< HarnessProps > = ( {
	autoDismissMs,
	resetKey,
	className,
} ) => {
	// eslint-disable-next-line sitekit/acronym-case
	const [ anchorElement, setAnchorElement ] =
		useState< HTMLButtonElement | null >( null );

	return (
		<Fragment>
			<button type="button" ref={ setAnchorElement }>
				Anchor
			</button>
			<button type="button">Outside</button>
			<Popper
				anchorEl={ anchorElement }
				onClose={ () => setAnchorElement( null ) }
				autoDismissMs={ autoDismissMs }
				resetKey={ resetKey }
				className={ className }
			>
				<button type="button">Inside</button>
			</Popper>
		</Fragment>
	);
};

describe( 'Popper', () => {
	it( 'renders nothing when `anchorEl` is null', () => {
		const { queryByText } = render(
			<Popper anchorEl={ null } onClose={ () => {} }>
				<span>Inside</span>
			</Popper>
		);

		expect( queryByText( 'Inside' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the content when `anchorEl` is set', async () => {
		const { findByRole } = render( <PopperHarness /> );

		expect(
			await findByRole( 'button', { name: 'Inside' } )
		).toBeInTheDocument();
	} );

	it( 'closes on mousedown outside the anchor and content', async () => {
		const { findByRole, getByRole, queryByRole } = render(
			<PopperHarness />
		);

		await findByRole( 'button', { name: 'Inside' } );

		fireEvent.mouseDown( getByRole( 'button', { name: 'Outside' } ) );

		expect(
			queryByRole( 'button', { name: 'Inside' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the content open on mousedown inside it', async () => {
		const { findByRole, queryByRole } = render( <PopperHarness /> );

		const inside = await findByRole( 'button', { name: 'Inside' } );
		fireEvent.mouseDown( inside );

		expect(
			queryByRole( 'button', { name: 'Inside' } )
		).toBeInTheDocument();
	} );

	it( 'closes when the Escape key is pressed', async () => {
		const { findByRole, queryByRole } = render( <PopperHarness /> );

		await findByRole( 'button', { name: 'Inside' } );

		fireEvent.keyDown( document.body, {
			key: 'Escape',
			keyCode: 27,
		} );

		expect(
			queryByRole( 'button', { name: 'Inside' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders content inline so it shares a parent with the anchor', async () => {
		const { findByRole, getByRole } = render( <PopperHarness /> );

		const anchor = getByRole( 'button', { name: 'Anchor' } );
		const inside = await findByRole( 'button', { name: 'Inside' } );

		expect( anchor.parentElement?.contains( inside ) ).toBe( true );
	} );

	it( 'places focusable content after the anchor in DOM order', async () => {
		const { container, findByRole, getByRole } = render(
			<PopperHarness />
		);

		const anchor = getByRole( 'button', { name: 'Anchor' } );
		const inside = await findByRole( 'button', { name: 'Inside' } );

		const focusable = Array.from(
			container.querySelectorAll(
				'button, a[href], [tabindex]:not([tabindex="-1"])'
			)
		);

		expect( focusable.indexOf( inside ) ).toBeGreaterThan(
			focusable.indexOf( anchor )
		);
	} );

	describe( 'auto-dismiss', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'closes after the configured delay', () => {
			const { queryByRole } = render(
				<PopperHarness autoDismissMs={ 1500 } />
			);

			expect(
				queryByRole( 'button', { name: 'Inside' } )
			).toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( 1500 );
			} );

			expect(
				queryByRole( 'button', { name: 'Inside' } )
			).not.toBeInTheDocument();
		} );

		it( 'stays open when `autoDismissMs` is 0', () => {
			const { queryByRole } = render(
				<PopperHarness autoDismissMs={ 0 } />
			);

			act( () => {
				jest.advanceTimersByTime( 60_000 );
			} );

			expect(
				queryByRole( 'button', { name: 'Inside' } )
			).toBeInTheDocument();
		} );

		it( 'pauses while the content is hovered', () => {
			const { container, queryByRole } = render(
				<PopperHarness autoDismissMs={ 1000 } />
			);

			const content = container.querySelector( '.googlesitekit-popper' );
			expect( content ).not.toBeNull();
			fireEvent.mouseEnter( content as Element );

			act( () => {
				jest.advanceTimersByTime( 5000 );
			} );

			expect(
				queryByRole( 'button', { name: 'Inside' } )
			).toBeInTheDocument();
		} );

		it( 'restarts the timer when `resetKey` changes', () => {
			const { rerender, queryByRole } = render(
				<PopperHarness autoDismissMs={ 1000 } resetKey={ 1 } />
			);

			act( () => {
				jest.advanceTimersByTime( 800 );
			} );

			rerender( <PopperHarness autoDismissMs={ 1000 } resetKey={ 2 } /> );

			act( () => {
				jest.advanceTimersByTime( 800 );
			} );

			expect(
				queryByRole( 'button', { name: 'Inside' } )
			).toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( 300 );
			} );

			expect(
				queryByRole( 'button', { name: 'Inside' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
