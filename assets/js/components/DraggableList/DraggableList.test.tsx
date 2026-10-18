/**
 * DraggableList component tests.
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
import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter';
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	act,
	createDragEvent,
	dragInput,
	fireEvent,
	render,
	screen,
	within,
} from '@tests/js/test-utils';
import DraggableList, {
	DraggableListProps,
	DraggableListRenderOptions,
} from './DraggableList';
import DragHandle from './DragHandle';

jest.mock(
	'@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter',
	() => ( {
		draggable: jest.fn(),
		dropTargetForElements: jest.fn(),
		monitorForElements: jest.fn(),
	} )
);

const mockDraggable = jest.mocked( draggable );
const mockMonitor = jest.mocked( monitorForElements );

const items = [
	{ id: 'a', label: 'Alpha' },
	{ id: 'b', label: 'Bravo' },
	{ id: 'c', label: 'Charlie' },
];

interface NestedRowProps {
	leadingElement: ReactNode;
	children: ReactNode;
}

const NestedRow: FC< NestedRowProps > = ( { leadingElement, children } ) => (
	<div data-testid="nested-row">
		{ leadingElement }
		<span>{ children }</span>
	</div>
);

function getItemID( item: typeof items[ number ] ) {
	return item.id;
}

function renderItem( {
	item,
	DragHandle: Handle,
}: DraggableListRenderOptions< typeof items[ number ] > ) {
	return (
		<Fragment>
			<Handle aria-label={ `Move ${ item.label }` } />
			<span>{ item.label }</span>
		</Fragment>
	);
}

function setup(
	overrides: Partial< DraggableListProps< typeof items[ number ] > > = {}
) {
	const onChange = jest.fn();
	const props = { items, getItemID, onChange, renderItem, ...overrides };
	const view = render( <DraggableList { ...props } /> );

	function accept() {
		props.items =
			onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ];

		view.rerender( <DraggableList { ...props } /> );
	}

	function dragEvent(
		sourceIndex: number,
		targetIndex: number,
		edge: 'top' | 'bottom' = 'bottom'
	) {
		const rows = within( view.container ).getAllByRole( 'listitem' );

		const registration = mockDraggable.mock.calls.find(
			( [ args ] ) => args.element === rows[ sourceIndex ]
		)![ 0 ];

		const sourceData = registration.getInitialData!( {
			element: registration.element,
			dragHandle: registration.dragHandle!,
			input: dragInput,
		} );

		const targetData = {
			...sourceData,
			itemID: props.items[ targetIndex ].id,
		};

		return createDragEvent( sourceData, targetData, edge );
	}

	const monitor =
		mockMonitor.mock.calls[ mockMonitor.mock.calls.length - 1 ][ 0 ];

	return { ...view, props, onChange, accept, dragEvent, monitor };
}

describe( 'DraggableList', () => {
	beforeEach( () => {
		jest.useFakeTimers();

		jest.mocked( dropTargetForElements )
			.mockReset()
			.mockImplementation( () => jest.fn() );

		mockDraggable.mockReset().mockImplementation( () => jest.fn() );
		mockMonitor.mockReset().mockImplementation( () => jest.fn() );
	} );

	it( 'should render supplied items with their accessible handles and instructions', () => {
		const renderItemSpy = jest.fn( renderItem );

		setup( { renderItem: renderItemSpy } );

		expect(
			screen.getAllByRole( 'listitem' ).map( ( row ) => row.textContent )
		).toEqual( [ 'Alpha', 'Bravo', 'Charlie' ] );

		const handles = screen.getAllByRole( 'button' );

		expect( handles ).toHaveLength( items.length );

		handles.forEach( ( handle, index ) => {
			expect( handle ).toHaveAccessibleName(
				`Move ${ items[ index ].label }`
			);

			expect( handle ).toHaveAccessibleDescription(
				'Use the Up and Down arrow keys to move this item.'
			);
		} );

		items.forEach( ( item, index ) =>
			expect( renderItemSpy ).toHaveBeenCalledWith(
				{ item, DragHandle },
				index
			)
		);
	} );

	it( 'should preserve a nested handle and its focus through parent rerenders and reordering', () => {
		const view = setup( {
			renderItem: ( { item, DragHandle: Handle } ) => (
				<NestedRow
					leadingElement={
						<Handle aria-label={ `Move ${ item.label }` } />
					}
				>
					{ item.label }
				</NestedRow>
			),
		} );

		const rows = screen.getAllByRole( 'listitem' );
		const handle = within( rows[ 1 ] ).getByRole( 'button', {
			name: 'Move Bravo',
		} );

		expect( screen.getAllByRole( 'button' ) ).toHaveLength( items.length );
		expect( handle.parentElement ).toBe( rows[ 1 ].firstChild );

		handle.focus();
		view.rerender( <DraggableList { ...view.props } /> );

		expect( screen.getByRole( 'button', { name: 'Move Bravo' } ) ).toBe(
			handle
		);
		expect( handle ).toHaveFocus();

		fireEvent.keyDown( handle, { key: 'ArrowUp' } );

		expect( view.onChange ).toHaveBeenCalledWith( [
			items[ 1 ],
			items[ 0 ],
			items[ 2 ],
		] );

		view.accept();

		expect( screen.getByRole( 'button', { name: 'Move Bravo' } ) ).toBe(
			handle
		);

		expect( handle ).toHaveFocus();
		expect( screen.getAllByRole( 'listitem' )[ 0 ] ).toBe( rows[ 1 ] );
	} );

	it( 'should preserve field values, DOM identity, and normal control interaction across dragging and reordering', () => {
		const onClick = jest.fn();

		const view = setup( {
			renderItem: ( { item, DragHandle: Handle } ) => (
				<Fragment>
					<Handle aria-label={ `Move ${ item.label }` } />
					<input
						aria-label={ item.label }
						defaultValue={ item.label }
					/>
					<button onClick={ onClick }>Edit { item.label }</button>
				</Fragment>
			),
		} );

		const field = screen.getByRole( 'textbox', { name: 'Alpha' } );

		fireEvent.change( field, { target: { value: 'Edited answer' } } );
		fireEvent.click( screen.getByRole( 'button', { name: 'Edit Alpha' } ) );

		expect( onClick ).toHaveBeenCalledTimes( 1 );

		fireEvent.keyDown( field, { key: 'ArrowDown' } );

		expect( view.onChange ).not.toHaveBeenCalled();

		const event = view.dragEvent( 0, 2 );

		field.focus();

		act( () => {
			view.monitor.onDragStart!( event );
			view.monitor.onDrag!( event );
		} );

		expect( screen.getByRole( 'textbox', { name: 'Alpha' } ) ).toBe(
			field
		);

		expect( field ).toHaveValue( 'Edited answer' );

		expect( screen.getAllByRole( 'listitem' )[ 0 ] ).toHaveClass(
			'googlesitekit-draggable-list__item--dragging'
		);

		act( () => view.monitor.onDrop!( event ) );
		view.accept();

		expect( screen.getByRole( 'textbox', { name: 'Alpha' } ) ).toBe(
			field
		);

		expect( field ).toHaveValue( 'Edited answer' );
		expect( field ).toHaveFocus();

		expect(
			within( screen.getAllByRole( 'listitem' )[ 2 ] ).getByRole(
				'textbox'
			)
		).toBe( field );
	} );

	it.each( [
		{
			label: 'after the destination row when moving downward',
			source: 0,
			target: 2,
			edge: 'bottom' as const,
			placement: 'after',
		},
		{
			label: 'before the destination row when moving upward',
			source: 2,
			target: 0,
			edge: 'top' as const,
			placement: 'before',
		},
	] )(
		'should show the insertion line $label',
		( { source, target, edge, placement } ) => {
			const view = setup();
			const event = view.dragEvent( source, target, edge );

			act( () => {
				view.monitor.onDragStart!( event );
				view.monitor.onDropTargetChange!( event );
			} );

			expect( screen.getAllByRole( 'listitem' )[ target ] ).toHaveClass(
				`googlesitekit-draggable-list__item--inserting-${ placement }`
			);

			act( () =>
				view.monitor.onDrag!( view.dragEvent( source, source ) )
			);

			expect(
				view.container.querySelector( '[class*="--inserting-"]' )
			).not.toBeInTheDocument();

			act( () =>
				view.monitor.onDrop!( createDragEvent( event.source.data ) )
			);

			expect(
				view.container.querySelector(
					'.googlesitekit-draggable-list__item--dragging'
				)
			).not.toBeInTheDocument();
		}
	);

	it( 'should render working default handles with position labels', () => {
		const view = setup( {
			showHandle: true,
			renderItem: ( { item } ) => <span>{ item.label }</span>,
		} );

		const handles = screen.getAllByRole( 'button' );

		expect( handles ).toHaveLength( 3 );

		handles.forEach( ( handle, index ) => {
			expect( handle ).toHaveAccessibleName( `Move item ${ index + 1 }` );

			expect(
				screen.getAllByRole( 'listitem' )[ index ].firstChild
			).toBe( handle );
		} );

		fireEvent.keyDown( handles[ 0 ], { key: 'ArrowDown' } );
		view.accept();

		expect( handles[ 0 ] ).toHaveAccessibleName( 'Move item 2' );

		expect(
			screen.getAllByRole( 'listitem' ).map( ( row ) => row.textContent )
		).toEqual( [ 'Bravo', 'Alpha', 'Charlie' ] );
	} );

	it( 'should keep the live region mounted while announcement text is cleared and updated', () => {
		const view = setup();
		const region = view.container.querySelector( '[aria-live="polite"]' );
		const child = region!.firstChild;

		expect( region ).toHaveAttribute( 'aria-atomic', 'true' );
		expect( region!.textContent ).toBe( '' );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move Alpha' } ),
			{ key: 'ArrowDown' }
		);

		view.accept();
		act( () => jest.runOnlyPendingTimers() );

		expect( region ).toHaveTextContent( 'Moved to position 2 of 3' );

		fireEvent.keyDown(
			screen.getByRole( 'button', { name: 'Move Alpha' } ),
			{ key: 'ArrowDown' }
		);

		view.accept();

		expect( region!.textContent ).toBe( '' );
		expect( region!.firstChild ).toBe( child );

		act( () => jest.runOnlyPendingTimers() );

		expect( region ).toHaveTextContent( 'Moved to position 3 of 3' );

		expect( view.container.querySelector( '[aria-live="polite"]' ) ).toBe(
			region
		);

		expect( region!.firstChild ).toBe( child );
	} );
} );
