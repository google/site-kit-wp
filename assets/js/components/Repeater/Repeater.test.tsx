/**
 * Repeater tests.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TextField } from 'googlesitekit-components';
import { act, fireEvent, render, screen, within } from '@tests/js/test-utils';
import { RemoveButtonContext } from './RemoveButtonContext';
import Repeater, {
	RepeaterFieldRenderOptions,
	RepeaterListRenderOptions,
	RepeaterProps,
} from './Repeater';
import { RepeaterContext } from './RepeaterContext';

interface Entry {
	id: string;
	value: string;
	metadata?: { valid: boolean };
}

const initialItems: Entry[] = [
	{ id: 'alpha', value: 'First' },
	{ id: 'beta', value: 'Second' },
	{ id: 'gamma', value: 'Third' },
];

function renderField(
	{
		item,
		updateItem,
		inputRef,
		RemoveButton,
	}: RepeaterFieldRenderOptions< Entry >,
	index: number
) {
	return (
		<div>
			<input
				aria-label={ `Answer ${ index + 1 }` }
				onChange={ ( event ) =>
					updateItem( { ...item, value: event.target.value } )
				}
				ref={ inputRef }
				value={ item.value }
			/>
			<RemoveButton label={ `Remove Answer ${ index + 1 }` } />
		</div>
	);
}

function setup( overrides: Partial< RepeaterProps< Entry > > = {} ) {
	const onChange = jest.fn();
	const getNewItem = jest.fn( () => ( { id: 'new-answer', value: '' } ) );

	let props: RepeaterProps< Entry > = {
		items: initialItems,
		getItemID: ( item ) => item.id,
		getNewItem,
		onChange,
		maxItems: 5,
		renderField,
		...overrides,
	};

	const result = render( <Repeater { ...props } /> );

	return {
		...result,
		onChange,
		getNewItem,
		updateProps( updates: Partial< RepeaterProps< Entry > > ) {
			props = { ...props, ...updates };
			result.rerender( <Repeater { ...props } /> );
		},
		acceptChange() {
			props = {
				...props,
				items: onChange.mock.calls[
					onChange.mock.calls.length - 1
				][ 0 ],
			};

			result.rerender( <Repeater { ...props } /> );
		},
	};
}

describe( 'Repeater', () => {
	it( 'should render supplied entries and callback indexes in order', () => {
		const field = jest.fn( renderField );

		const { container } = setup( {
			renderField: field,
			className: 'custom-repeater',
		} );

		expect(
			screen
				.getAllByRole( 'textbox' )
				.map( ( input ) => ( input as HTMLInputElement ).value )
		).toEqual( [ 'First', 'Second', 'Third' ] );

		initialItems.forEach( ( item, index ) =>
			expect( field ).toHaveBeenCalledWith(
				expect.objectContaining( { item } ),
				index
			)
		);

		expect(
			container.querySelector( '.googlesitekit-repeater' )
		).toHaveClass( 'custom-repeater' );

		expect(
			screen.getByRole( 'button', { name: 'Add' } )
		).toHaveTextContent( 'Add' );
	} );

	it( 'should accept consumer-defined item shapes and IDs without requiring remove controls', () => {
		const onChange = jest.fn();

		render(
			<Repeater
				getItemID={ ( item ) => item }
				getNewItem={ () => 'three' }
				items={ [ 'one', 'two' ] }
				maxItems={ 3 }
				onChange={ onChange }
				renderField={ ( { item, inputRef } ) => (
					<input
						aria-label={ item }
						defaultValue={ item }
						ref={ inputRef }
					/>
				) }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: /Remove/ } )
		).not.toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Add' } ) );

		expect( onChange ).toHaveBeenCalledWith( [ 'one', 'two', 'three' ] );
	} );

	it( 'should append one new empty entry immutably and focus it after acceptance', () => {
		const { onChange, getNewItem, acceptChange } = setup( {
			items: Object.freeze( [ ...initialItems ] ) as Entry[],
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'Add' } ) );

		expect( getNewItem ).toHaveBeenCalledTimes( 1 );
		expect( getNewItem ).toHaveBeenCalledWith( 3 );
		expect( onChange ).toHaveBeenCalledTimes( 1 );

		const nextItems = onChange.mock.calls[ 0 ][ 0 ];

		expect( nextItems ).toEqual( [
			...initialItems,
			{ id: 'new-answer', value: '' },
		] );

		initialItems.forEach( ( item, index ) =>
			expect( nextItems[ index ] ).toBe( item )
		);

		acceptChange();

		expect(
			screen.getByRole( 'textbox', { name: 'Answer 4' } )
		).toHaveFocus();
	} );

	it.each( [ 3, 2, 0 ] )(
		'should disable and guard addition at or above a maximum of %s',
		( maxItems ) => {
			let addItem: () => void;

			const { getNewItem, onChange } = setup( {
				maxItems,
				renderList: ( { AddButton } ) => (
					<RepeaterContext.Consumer>
						{ ( context ) => {
							addItem = context!.addItem;
							return <AddButton>Add answer</AddButton>;
						} }
					</RepeaterContext.Consumer>
				),
			} );

			expect(
				screen.getByRole( 'button', { name: /Add answer/ } )
			).toBeDisabled();

			fireEvent.click(
				screen.getByRole( 'button', { name: /Add answer/ } )
			);

			act( () => addItem() );

			expect( getNewItem ).not.toHaveBeenCalled();
			expect( onChange ).not.toHaveBeenCalled();
		}
	);

	it( 'should replace complete items by stable ID using the latest order and callback', () => {
		const field = jest.fn( renderField );
		const { updateProps, onChange } = setup( { renderField: field } );
		const updateItem = field.mock.calls[ 0 ][ 0 ].updateItem;

		const reordered = [
			initialItems[ 2 ],
			initialItems[ 0 ],
			initialItems[ 1 ],
		];

		const latestOnChange = jest.fn();
		updateProps( { items: reordered, onChange: latestOnChange } );

		const replacement = {
			id: 'alpha',
			value: 'Edited',
			metadata: { valid: true },
		};

		act( () => updateItem( replacement ) );

		expect( onChange ).not.toHaveBeenCalled();
		expect( latestOnChange ).toHaveBeenCalledTimes( 1 );

		expect( latestOnChange.mock.calls[ 0 ][ 0 ] ).toEqual( [
			initialItems[ 2 ],
			replacement,
			initialItems[ 1 ],
		] );

		expect( latestOnChange.mock.calls[ 0 ][ 0 ][ 0 ] ).toBe(
			initialItems[ 2 ]
		);

		expect( latestOnChange.mock.calls[ 0 ][ 0 ][ 1 ] ).toBe( replacement );

		expect( latestOnChange.mock.calls[ 0 ][ 0 ][ 2 ] ).toBe(
			initialItems[ 1 ]
		);

		expect( reordered[ 1 ] ).toBe( initialItems[ 0 ] );
	} );

	it( 'should ignore updates that change an ID or target an entry already removed', () => {
		const field = jest.fn( renderField );
		const { updateProps, onChange } = setup( { renderField: field } );
		const updateItem = field.mock.calls[ 0 ][ 0 ].updateItem;

		act( () => updateItem( { id: 'changed-id', value: 'Edited' } ) );

		updateProps( { items: initialItems.slice( 1 ) } );

		act( () => updateItem( { id: 'alpha', value: 'Edited' } ) );

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'middle', 1, 'Answer 1' ],
		[ 'first', 0, 'Answer 1' ],
		[ 'last', 2, 'Answer 2' ],
	] )(
		'should remove the %s entry immutably and focus its neighbor',
		( _, index, target ) => {
			const { onChange, acceptChange } = setup( {
				maxItems: 3,
				items: Object.freeze( [ ...initialItems ] ) as Entry[],
			} );

			fireEvent.click(
				screen.getByRole( 'button', {
					name: `Remove Answer ${ Number( index ) + 1 }`,
				} )
			);

			expect( onChange ).toHaveBeenCalledTimes( 1 );

			const expected = initialItems.filter(
				( item, itemIndex ) => itemIndex !== index
			);

			expect( onChange.mock.calls[ 0 ][ 0 ] ).toEqual( expected );

			expected.forEach( ( item, itemIndex ) =>
				expect( onChange.mock.calls[ 0 ][ 0 ][ itemIndex ] ).toBe(
					item
				)
			);

			acceptChange();

			expect(
				screen.getByRole( 'textbox', { name: target as string } )
			).toHaveFocus();

			expect(
				screen.getByRole( 'button', { name: 'Add' } )
			).toBeEnabled();
		}
	);

	it( 'should remove the final entry, focus Add, and allow a new first entry', () => {
		const { onChange, getNewItem, acceptChange } = setup( {
			items: initialItems.slice( 0, 1 ),
			maxItems: 1,
		} );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove Answer 1' } )
		);

		expect( onChange ).toHaveBeenLastCalledWith( [] );

		acceptChange();

		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();

		const addButton = screen.getByRole( 'button', { name: 'Add' } );

		expect( addButton ).toHaveFocus();

		fireEvent.click( addButton );

		expect( getNewItem ).toHaveBeenCalledWith( 0 );

		acceptChange();

		expect(
			screen.getByRole( 'textbox', { name: 'Answer 1' } )
		).toHaveFocus();
	} );

	it( 'should ignore stale removal callbacks for entries already removed', () => {
		let removeItem: () => void;

		const { onChange, updateProps } = setup( {
			renderField: ( options, index ) => (
				<RemoveButtonContext.Consumer>
					{ ( context ) => {
						if ( options.item.id === 'alpha' ) {
							removeItem = context!.removeItem;
						}

						return renderField( options, index );
					} }
				</RemoveButtonContext.Consumer>
			),
		} );

		updateProps( { items: initialItems.slice( 1 ) } );

		act( () => removeItem() );

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it.each( [ 'addition', 'removal' ] )(
		'should wait for a deferred %s through value-only parent updates',
		( operation ) => {
			const { onChange, updateProps } = setup();
			const first = screen.getByRole( 'textbox', { name: 'Answer 1' } );

			first.focus();

			fireEvent.click(
				screen.getByRole( 'button', {
					name: operation === 'addition' ? 'Add' : 'Remove Answer 2',
				} )
			);

			const requestedItems = onChange.mock.calls[ 0 ][ 0 ];

			expect( first ).toHaveFocus();

			updateProps( {
				items: initialItems.map( ( item ) => ( {
					...item,
					value: `${ item.value } updated`,
				} ) ),
			} );

			expect( first ).toHaveFocus();

			updateProps( { items: requestedItems } );

			expect(
				screen.getByRole( 'textbox', {
					name: operation === 'addition' ? 'Answer 4' : 'Answer 1',
				} )
			).toHaveFocus();
		}
	);

	it.each( [ 'addition', 'removal' ] )(
		'should cancel pending %s focus when a different structural update supersedes it',
		( operation ) => {
			const { onChange, updateProps } = setup();
			const first = screen.getByRole( 'textbox', { name: 'Answer 1' } );
			first.focus();

			fireEvent.click(
				screen.getByRole( 'button', {
					name: operation === 'addition' ? 'Add' : 'Remove Answer 2',
				} )
			);

			const requestedItems = onChange.mock.calls[ 0 ][ 0 ];

			updateProps( { items: [ ...initialItems ].reverse() } );
			expect( first ).toHaveFocus();

			updateProps( { items: requestedItems } );
			expect( first ).toHaveFocus();
		}
	);

	it( 'should preserve component, DOM, and ref identity across rerenders and release removed bindings', () => {
		const field = jest.fn( renderField );
		const { updateProps, unmount } = setup( { renderField: field } );
		const firstOptions = field.mock.calls[ 0 ][ 0 ];
		const firstInput = screen.getByRole( 'textbox', { name: 'Answer 1' } );

		const firstRemove = screen.getByRole( 'button', {
			name: 'Remove Answer 1',
		} );

		const addButton = screen.getByRole( 'button', { name: 'Add' } );

		firstRemove.focus();
		field.mockClear();

		updateProps( { items: [ ...initialItems ].reverse() } );

		const reorderedOptions = field.mock.calls[ 2 ][ 0 ];

		expect( reorderedOptions.inputRef ).toBe( firstOptions.inputRef );

		expect( reorderedOptions.RemoveButton ).toBe(
			firstOptions.RemoveButton
		);

		expect( screen.getByRole( 'textbox', { name: 'Answer 3' } ) ).toBe(
			firstInput
		);

		expect(
			screen.getByRole( 'button', { name: 'Remove Answer 3' } )
		).toBe( firstRemove );

		expect( firstRemove ).toHaveFocus();

		expect( screen.getByRole( 'button', { name: 'Add' } ) ).toBe(
			addButton
		);

		updateProps( { items: [] } );

		expect( firstInput ).not.toBeInTheDocument();

		field.mockClear();

		updateProps( { items: initialItems } );

		expect( field.mock.calls[ 0 ][ 0 ].inputRef ).not.toBe(
			firstOptions.inputRef
		);

		unmount();

		expect( addButton ).not.toBeInTheDocument();
	} );

	it( 'should focus a replacement TextField control through the same callback ref', () => {
		let textarea = false;

		const { updateProps, acceptChange } = setup( {
			renderField: (
				{ item, inputRef, RemoveButton, updateItem },
				index
			) => (
				<div>
					<TextField
						inputRef={ inputRef }
						inputType={ textarea ? 'textarea' : 'input' }
						label={ `Answer ${ index + 1 }` }
						onChange={ ( event ) =>
							updateItem( { ...item, value: event.target.value } )
						}
						textarea={ textarea }
						value={ item.value }
					/>
					<RemoveButton label={ `Remove Answer ${ index + 1 }` } />
				</div>
			),
		} );

		const originalInput = screen.getByRole( 'textbox', {
			name: 'Answer 1',
		} );

		textarea = true;
		updateProps( {} );

		expect( originalInput ).not.toBeInTheDocument();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove Answer 2' } )
		);

		acceptChange();

		expect(
			screen.getByRole( 'textbox', { name: 'Answer 1' } )
		).toHaveFocus();

		expect(
			screen.getByRole( 'textbox', { name: 'Answer 1' } ).tagName
		).toBe( 'TEXTAREA' );
	} );

	it( 'should preserve values and field focus after external reordering, edits, adds, and removals in a keyed custom list', () => {
		let currentItems = initialItems;

		const list = jest.fn(
			( {
				renderField: field,
				AddButton,
			}: RepeaterListRenderOptions< Entry > ) => (
				<Fragment>
					<ol>
						{ currentItems.map( ( item, index ) => (
							<li key={ item.id }>{ field( item, index ) }</li>
						) ) }
					</ol>
					<AddButton>Add answer</AddButton>
				</Fragment>
			)
		);

		const { onChange, updateProps } = setup( { renderList: list } );

		const originalAdd = list.mock.calls[ 0 ][ 0 ].AddButton;
		const focusedInput = screen.getByRole( 'textbox', {
			name: 'Answer 3',
		} );

		focusedInput.focus();

		currentItems = [ ...initialItems ].reverse();

		updateProps( { items: currentItems } );

		expect( focusedInput ).toHaveFocus();
		expect( list.mock.calls[ 1 ][ 0 ].AddButton ).toBe( originalAdd );
		expect( screen.getByRole( 'textbox', { name: 'Answer 1' } ) ).toBe(
			focusedInput
		);

		expect(
			screen
				.getAllByRole( 'textbox' )
				.map( ( input ) => ( input as HTMLInputElement ).value )
		).toEqual( [ 'Third', 'Second', 'First' ] );

		fireEvent.change( screen.getByRole( 'textbox', { name: 'Answer 1' } ), {
			target: { value: 'Third edited' },
		} );

		currentItems = onChange.mock.calls[ 0 ][ 0 ];

		updateProps( { items: currentItems } );

		expect( currentItems[ 0 ] ).toEqual( {
			id: 'gamma',
			value: 'Third edited',
		} );

		expect( focusedInput ).toHaveFocus();

		fireEvent.click( screen.getByRole( 'button', { name: 'Add answer' } ) );

		currentItems = onChange.mock.calls[ 1 ][ 0 ];

		updateProps( { items: currentItems } );

		expect(
			screen.getByRole( 'textbox', { name: 'Answer 4' } )
		).toHaveFocus();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove Answer 2' } )
		);

		currentItems = onChange.mock.calls[ 2 ][ 0 ];

		updateProps( { items: currentItems } );

		expect( currentItems ).toEqual( [
			{ id: 'gamma', value: 'Third edited' },
			initialItems[ 0 ],
			{ id: 'new-answer', value: '' },
		] );

		expect(
			screen.getByRole( 'textbox', { name: 'Answer 1' } )
		).toHaveFocus();
	} );

	it( 'should keep multiple repeaters independent even with identical item IDs', () => {
		const firstChange = jest.fn();
		const secondChange = jest.fn();

		const props = {
			items: initialItems,
			getItemID: ( item: Entry ) => item.id,
			getNewItem: () => ( { id: 'new', value: '' } ),
			maxItems: 5,
			renderField,
		};

		const { container, rerender } = render(
			<Fragment>
				<Repeater { ...props } onChange={ firstChange } />
				<Repeater { ...props } onChange={ secondChange } />
			</Fragment>
		);

		const repeaters = container.querySelectorAll< HTMLDivElement >(
			'.googlesitekit-repeater'
		);

		fireEvent.click(
			within( repeaters[ 1 ] ).getByRole( 'button', {
				name: 'Add',
			} )
		);

		expect( firstChange ).not.toHaveBeenCalled();
		expect( secondChange ).toHaveBeenCalledTimes( 1 );

		rerender(
			<Fragment>
				<Repeater { ...props } onChange={ firstChange } />
				<Repeater
					{ ...props }
					items={ secondChange.mock.calls[ 0 ][ 0 ] }
					onChange={ secondChange }
				/>
			</Fragment>
		);

		expect(
			within( repeaters[ 0 ] ).getAllByRole( 'textbox' )
		).toHaveLength( 3 );

		expect(
			within( repeaters[ 1 ] ).getByRole( 'textbox', {
				name: 'Answer 4',
			} )
		).toHaveFocus();
	} );

	it( 'should move focus after activating focused remove and add controls', () => {
		const { onChange, acceptChange } = setup( {
			items: initialItems.slice( 0, 1 ),
		} );

		const removeButton = screen.getByRole( 'button', {
			name: 'Remove Answer 1',
		} );

		removeButton.focus();

		expect( removeButton ).toHaveFocus();

		fireEvent.click( removeButton );

		expect( onChange ).toHaveBeenLastCalledWith( [] );
		acceptChange();

		const addButton = screen.getByRole( 'button', { name: 'Add' } );

		expect( addButton ).toHaveFocus();

		fireEvent.click( addButton );

		expect( onChange ).toHaveBeenLastCalledWith( [
			{ id: 'new-answer', value: '' },
		] );

		acceptChange();

		expect(
			screen.getByRole( 'textbox', { name: 'Answer 1' } )
		).toHaveFocus();
	} );

	it( 'should expose labeled native buttons that do not submit an enclosing form', () => {
		const onSubmit = jest.fn( ( event ) => event.preventDefault() );
		const onChange = jest.fn();

		render(
			<form onSubmit={ onSubmit }>
				<Repeater
					getItemID={ ( item ) => item.id }
					getNewItem={ () => ( { id: 'new', value: '' } ) }
					items={ initialItems }
					maxItems={ 5 }
					onChange={ onChange }
					renderField={ renderField }
				/>
			</form>
		);

		const buttons = screen.getAllByRole( 'button' );

		buttons.forEach( ( button ) => {
			expect( button.tagName ).toBe( 'BUTTON' );
			expect( button ).toHaveAttribute( 'type', 'button' );
			expect( button.tabIndex ).toBe( 0 );

			fireEvent.click( button );
		} );

		expect( onSubmit ).not.toHaveBeenCalled();
		expect( onChange ).toHaveBeenCalledTimes( buttons.length );
	} );
} );
