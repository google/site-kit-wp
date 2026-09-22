/**
 * FeedbackMenu component tests.
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
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';
import { DOWN, ENTER, ESCAPE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { act, fireEvent, render, waitFor } from '@tests/js/test-utils';
import FeedbackMenu, { FeedbackMenuOption } from './FeedbackMenu';

const options: FeedbackMenuOption[] = [
	{ id: 'hide', label: 'Just hide this suggestion' },
	{ id: 'feedback', label: 'Give feedback', value: 'selected-value' },
];

describe( 'FeedbackMenu', () => {
	it( 'should label the menu with its heading and expose options only when open', () => {
		const { getByRole, getAllByRole, queryByRole, rerender } = render(
			<FeedbackMenu
				id="feedback-menu"
				onClose={ jest.fn() }
				options={ options }
				isOpen
			/>
		);
		expect(
			getByRole( 'heading', { name: 'Help us improve' } )
		).toBeInTheDocument();
		expect( getAllByRole( 'menuitem' ) ).toHaveLength( 2 );
		expect(
			getByRole( 'menu', { name: 'Help us improve' } )
		).not.toContainElement( getByRole( 'heading' ) );
		expect(
			getByRole( 'menu', { name: 'Help us improve' } )
		).toHaveAttribute( 'aria-labelledby', getByRole( 'heading' ).id );
		rerender(
			<FeedbackMenu
				id="feedback-menu"
				isOpen={ false }
				onClose={ jest.fn() }
				options={ options }
			/>
		);
		expect( queryByRole( 'menu' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'Just hide this suggestion', undefined ],
		[ 'Give feedback', 'selected-value' ],
	] )(
		'should pass the value for "%s" and close the menu',
		async ( label, value ) => {
			const onSelect = jest.fn();
			const onClose = jest.fn();
			const { getByRole } = render(
				<FeedbackMenu
					id="feedback-menu"
					onSelect={ onSelect }
					onClose={ onClose }
					options={ options }
					isOpen
				/>
			);
			fireEvent.click( getByRole( 'menuitem', { name: label } ) );
			await waitFor( () =>
				expect( onSelect ).toHaveBeenCalledWith( value )
			);
			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( fetchMock ).not.toHaveFetched();
		}
	);

	it( 'should close after selection without an onSelect callback', async () => {
		const onClose = jest.fn();
		const { getByRole } = render(
			<FeedbackMenu
				id="feedback-menu"
				onClose={ onClose }
				options={ options }
				isOpen
			/>
		);
		fireEvent.click( getByRole( 'menuitem', { name: 'Give feedback' } ) );
		await waitFor( () => expect( onClose ).toHaveBeenCalledTimes( 1 ) );
	} );

	it.each( [ ESCAPE, TAB ] )(
		'should close on key code %s and restore source focus without selecting',
		( keyCode ) => {
			const onClose = jest.fn();
			const onSelect = jest.fn();
			const sourceRef = createRef< HTMLButtonElement >();
			const wrapperRef = createRef< HTMLDivElement >();
			const { getByRole } = render(
				<div ref={ wrapperRef }>
					<button ref={ sourceRef }>Open menu</button>
					<FeedbackMenu
						id="feedback-menu"
						onClose={ onClose }
						onSelect={ onSelect }
						options={ options }
						sourceRef={ sourceRef }
						wrapperRef={ wrapperRef }
						isOpen
					/>
				</div>
			);
			fireEvent.keyDown( getByRole( 'menu' ), { keyCode } );
			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( onSelect ).not.toHaveBeenCalled();
			expect( sourceRef.current ).toHaveFocus();
		}
	);

	it( 'should close on click away without selecting', () => {
		const onClose = jest.fn();
		const onSelect = jest.fn();
		render(
			<FeedbackMenu
				id="feedback-menu"
				onClose={ onClose }
				onSelect={ onSelect }
				options={ options }
				isOpen
			/>
		);
		fireEvent.mouseDown( document.body );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).not.toHaveBeenCalled();
	} );

	it( 'should navigate and select options with the keyboard', async () => {
		const onSelect = jest.fn();
		const { getByRole } = render(
			<FeedbackMenu
				id="feedback-menu"
				onClose={ jest.fn() }
				onSelect={ onSelect }
				options={ options }
				isOpen
			/>
		);
		const firstItem = getByRole( 'menuitem', {
			name: 'Just hide this suggestion',
		} );
		act( () => firstItem.focus() );
		fireEvent.keyDown( firstItem, { key: 'ArrowDown', keyCode: DOWN } );
		const secondItem = getByRole( 'menuitem', { name: 'Give feedback' } );
		expect( secondItem ).toHaveFocus();
		fireEvent.keyDown( secondItem, { key: 'Enter', keyCode: ENTER } );
		await waitFor( () =>
			expect( onSelect ).toHaveBeenCalledWith( 'selected-value' )
		);
	} );
} );
