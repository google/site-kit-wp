/**
 * RepeatableTextField tests.
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { fireEvent, render, screen } from '@tests/js/test-utils';
import RepeatableTextField from './RepeatableTextField';

interface Entry {
	key: number;
	text: string;
}

const initialItems: Entry[] = [
	{ key: 1, text: 'Daily' },
	{ key: 2, text: 'Weekly' },
	{ key: 3, text: 'Monthly' },
];

interface HarnessProps {
	items?: Entry[];
	legend?: string;
	maxItemLength?: number;
	maxItems?: number;
	onChange?: ( items: Entry[] ) => void;
}

function Harness( {
	items: initial = initialItems,
	legend,
	maxItemLength,
	maxItems = 5,
	onChange = () => {},
}: HarnessProps ) {
	const [ items, setItems ] = useState( initial );

	return (
		<RepeatableTextField
			addItemLabel="Add option"
			getItemID={ ( item ) => `option-${ item.key }` }
			getItemLabel={ ( index ) => `Option ${ index + 1 }` }
			getItemValue={ ( item ) => item.text }
			getMoveItemLabel={ ( index ) => `Move option ${ index + 1 }` }
			getNewItem={ () => ( {
				key: Math.max( 0, ...items.map( ( { key } ) => key ) ) + 1,
				text: '',
			} ) }
			getRemoveItemLabel={ ( index ) => `Remove option ${ index + 1 }` }
			getUpdatedItem={ ( text, item ) => ( { ...item, text } ) }
			items={ items }
			legend={ legend }
			maxItemLength={ maxItemLength }
			maxItems={ maxItems }
			onChange={ ( updatedItems ) => {
				setItems( updatedItems );
				onChange( updatedItems );
			} }
		/>
	);
}

function getFields() {
	return screen.getAllByRole( 'textbox' );
}

function getFieldValues() {
	return getFields().map( ( field ) => ( field as HTMLInputElement ).value );
}

describe( 'RepeatableTextField', () => {
	it( 'should label the group, fields and buttons from its props', () => {
		render( <Harness legend="Add 2-5 options" /> );

		expect(
			screen.getByRole( 'group', { name: 'Add 2-5 options' } )
		).toBeInTheDocument();

		[ 'Option 1', 'Option 2', 'Option 3' ].forEach( ( name ) =>
			expect(
				screen.getByRole( 'textbox', { name } )
			).toBeInTheDocument()
		);

		[ 'Move option 1', 'Remove option 1', 'Add option' ].forEach(
			( name ) =>
				expect(
					screen.getByRole( 'button', { name } )
				).toBeInTheDocument()
		);
	} );

	it( 'should render no legend without one', () => {
		const { container } = render( <Harness /> );

		expect( container.querySelector( 'legend' ) ).not.toBeInTheDocument();
	} );

	it( 'should limit each field to the maximum item length', () => {
		render( <Harness maxItemLength={ 20 } /> );

		getFields().forEach( ( field ) =>
			expect( field ).toHaveAttribute( 'maxlength', '20' )
		);
	} );

	it( 'should add items until the maximum, then disable the add button', () => {
		render( <Harness maxItems={ 4 } /> );

		const addButton = screen.getByRole( 'button', { name: 'Add option' } );

		fireEvent.click( addButton );

		expect( getFields() ).toHaveLength( 4 );
		expect( addButton ).toBeDisabled();
	} );

	it( 'should read and update items through the item props', () => {
		const onChange = jest.fn();

		render( <Harness onChange={ onChange } /> );

		expect( getFieldValues() ).toEqual( [ 'Daily', 'Weekly', 'Monthly' ] );

		fireEvent.change( screen.getByRole( 'textbox', { name: 'Option 2' } ), {
			target: { value: 'Fortnightly' },
		} );

		expect( onChange ).toHaveBeenLastCalledWith( [
			initialItems[ 0 ],
			{ key: 2, text: 'Fortnightly' },
			initialItems[ 2 ],
		] );

		fireEvent.click( screen.getByRole( 'button', { name: 'Add option' } ) );

		expect( onChange ).toHaveBeenLastCalledWith( [
			initialItems[ 0 ],
			{ key: 2, text: 'Fortnightly' },
			initialItems[ 2 ],
			{ key: 4, text: '' },
		] );
	} );

	it( 'should remove and add items in their reordered positions', () => {
		const onChange = jest.fn();

		render( <Harness onChange={ onChange } /> );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move option 1' } ),
			{ key: 'ArrowDown' }
		);

		expect( getFieldValues() ).toEqual( [ 'Weekly', 'Daily', 'Monthly' ] );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove option 2' } )
		);

		expect( getFieldValues() ).toEqual( [ 'Weekly', 'Monthly' ] );

		fireEvent.click( screen.getByRole( 'button', { name: 'Add option' } ) );

		expect( getFieldValues() ).toEqual( [ 'Weekly', 'Monthly', '' ] );

		expect(
			screen.getByRole( 'textbox', { name: 'Option 3' } )
		).toHaveFocus();

		expect( onChange ).toHaveBeenCalledTimes( 3 );
	} );
} );
