/**
 * `useRepeaterFocus` hook tests.
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
import useRepeaterFocus from './useRepeaterFocus';

interface TestProps {
	inputType?: 'input' | 'textarea';
	itemIDs: string[];
	onRender: ( focus: ReturnType< typeof useRepeaterFocus > ) => void;
}

function TestRepeaterFocus( {
	itemIDs,
	inputType = 'input',
	onRender,
}: TestProps ) {
	const focus = useRepeaterFocus( itemIDs );

	onRender( focus );

	return (
		<div>
			{ itemIDs.map( ( itemID ) =>
				inputType === 'textarea' ? (
					<textarea
						aria-label={ itemID }
						key={ itemID }
						ref={ focus.getInputRef( itemID ) }
					/>
				) : (
					<input
						aria-label={ itemID }
						key={ itemID }
						ref={ focus.getInputRef( itemID ) }
					/>
				)
			) }
			<button ref={ focus.addButtonRef } type="button">
				Add
			</button>
		</div>
	);
}

const initialIDs = [ 'alpha', 'beta', 'gamma' ];

function setup( itemIDs = initialIDs ) {
	const onRender = jest.fn<
		void,
		[ ReturnType< typeof useRepeaterFocus > ]
	>();

	let props: TestProps = { itemIDs, onRender };
	const view = render( <TestRepeaterFocus { ...props } /> );

	return {
		...view,
		get focus() {
			return onRender.mock.calls[ onRender.mock.calls.length - 1 ][ 0 ];
		},
		updateProps( updates: Partial< TestProps > ) {
			props = { ...props, ...updates };
			view.rerender( <TestRepeaterFocus { ...props } /> );
		},
	};
}

describe( 'useRepeaterFocus', () => {
	it( 'should focus the new input after the addition is accepted', () => {
		const view = setup();
		const addButton = view.getByRole( 'button', { name: 'Add' } );

		addButton.focus();

		act( () => view.focus.requestFocusAfterAdd( 'delta' ) );

		expect( addButton ).toHaveFocus();

		view.updateProps( { itemIDs: [ ...initialIDs, 'delta' ] } );

		expect( view.getByRole( 'textbox', { name: 'delta' } ) ).toHaveFocus();
	} );

	it.each( [
		[ 'beta', 'alpha' ],
		[ 'alpha', 'beta' ],
		[ 'gamma', 'beta' ],
	] )(
		'should focus the neighbor of %s (%s) after removal',
		( itemID, targetID ) => {
			const view = setup();

			view.getByRole( 'textbox', { name: itemID } ).focus();
			act( () => view.focus.requestFocusAfterRemove( itemID ) );

			view.updateProps( {
				itemIDs: initialIDs.filter( ( id ) => id !== itemID ),
			} );

			expect(
				view.getByRole( 'textbox', { name: targetID } )
			).toHaveFocus();
		}
	);

	it( 'should focus Add after removing the final input and focus the next input added', () => {
		const view = setup( [ 'alpha' ] );

		act( () => view.focus.requestFocusAfterRemove( 'alpha' ) );

		view.updateProps( { itemIDs: [] } );

		expect( view.getByRole( 'button', { name: 'Add' } ) ).toHaveFocus();

		act( () => view.focus.requestFocusAfterAdd( 'delta' ) );

		view.updateProps( { itemIDs: [ 'delta' ] } );

		expect( view.getByRole( 'textbox', { name: 'delta' } ) ).toHaveFocus();
	} );

	it.each( [ 'addition', 'removal' ] )(
		'should wait for a deferred %s through updates with unchanged IDs',
		( operation ) => {
			const view = setup();
			const first = view.getByRole( 'textbox', { name: 'alpha' } );

			const expectedIDs =
				operation === 'addition'
					? [ ...initialIDs, 'delta' ]
					: [ 'beta', 'gamma' ];

			first.focus();

			act( () => {
				if ( operation === 'addition' ) {
					view.focus.requestFocusAfterAdd( 'delta' );
				} else {
					view.focus.requestFocusAfterRemove( 'alpha' );
				}
			} );

			expect( first ).toHaveFocus();

			view.updateProps( { itemIDs: [ ...initialIDs ] } );

			expect( first ).toHaveFocus();

			view.updateProps( { itemIDs: expectedIDs } );

			expect(
				view.getByRole( 'textbox', {
					name: operation === 'addition' ? 'delta' : 'beta',
				} )
			).toHaveFocus();
		}
	);

	it.each( [ 'addition', 'removal' ] )(
		'should cancel pending %s focus after a different structural update',
		( operation ) => {
			const view = setup();

			const focusedInput = view.getByRole( 'textbox', {
				name: 'gamma',
			} );

			const expectedIDs =
				operation === 'addition'
					? [ ...initialIDs, 'delta' ]
					: [ 'alpha', 'gamma' ];

			focusedInput.focus();

			act( () => {
				if ( operation === 'addition' ) {
					view.focus.requestFocusAfterAdd( 'delta' );
				} else {
					view.focus.requestFocusAfterRemove( 'beta' );
				}
			} );

			view.updateProps( { itemIDs: [ ...initialIDs ].reverse() } );

			expect( focusedInput ).toHaveFocus();

			view.updateProps( { itemIDs: expectedIDs } );

			expect( focusedInput ).toHaveFocus();
		}
	);

	it( 'should preserve refs through reordering and release removed bindings', () => {
		const view = setup();

		const addRef = view.focus.addButtonRef;
		const first = view.getByRole( 'textbox', { name: 'alpha' } );
		const firstRef = view.focus.getInputRef( 'alpha' );

		first.focus();
		view.updateProps( { itemIDs: [ ...initialIDs ].reverse() } );

		expect( view.focus.getInputRef( 'alpha' ) ).toBe( firstRef );
		expect( view.focus.addButtonRef ).toBe( addRef );
		expect( first ).toHaveFocus();

		view.updateProps( { itemIDs: [] } );

		expect( first ).not.toBeInTheDocument();

		view.updateProps( { itemIDs: initialIDs } );

		expect( view.focus.getInputRef( 'alpha' ) ).not.toBe( firstRef );

		view.unmount();

		expect( addRef.current ).toBeNull();
	} );

	it( 'should focus a replacement input through the same callback ref', () => {
		const view = setup();

		const firstRef = view.focus.getInputRef( 'alpha' );

		const first = view.getByRole( 'textbox', { name: 'alpha' } );

		view.updateProps( { inputType: 'textarea' } );

		expect( first ).not.toBeInTheDocument();
		expect( view.focus.getInputRef( 'alpha' ) ).toBe( firstRef );

		act( () => view.focus.requestFocusAfterRemove( 'beta' ) );

		view.updateProps( { itemIDs: [ 'alpha', 'gamma' ] } );

		const replacement = view.getByRole( 'textbox', { name: 'alpha' } );

		expect( replacement.tagName ).toBe( 'TEXTAREA' );
		expect( replacement ).toHaveFocus();
	} );
} );
