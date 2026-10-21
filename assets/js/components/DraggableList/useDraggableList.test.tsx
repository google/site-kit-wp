/**
 * `useDraggableList` hook tests.
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
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter';
import { KeyboardEvent } from 'react';

/**
 * Internal dependencies
 */
import {
	actHook as act,
	createDragEvent,
	dragInput,
	renderHook,
} from '@tests/js/test-utils';
import useDraggableList from './useDraggableList';

jest.mock(
	'@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter',
	() => ( {
		draggable: jest.fn(),
		dropTargetForElements: jest.fn(),
		monitorForElements: jest.fn(),
	} )
);

const mockDraggable = jest.mocked( draggable );
const mockDropTarget = jest.mocked( dropTargetForElements );
const mockMonitor = jest.mocked( monitorForElements );

const items = [
	{ id: 'a', value: 'Alpha' },
	{ id: 'b', value: 'Bravo' },
	{ id: 'c', value: 'Charlie' },
];

function getItemID( item: typeof items[ number ] ) {
	return item.id;
}

function setup() {
	const onChange = jest.fn();

	const hook = renderHook(
		( props ) => useDraggableList( { ...props, getItemID } ),
		{
			initialProps: { items, onChange },
		}
	);

	const list = document.createElement( 'ol' );

	list.dataset.draggableTest = 'true';

	document.body.appendChild( list );

	const bindings = items.map( ( item ) => {
		const row = document.createElement( 'li' );
		const handle = document.createElement( 'button' );

		row.appendChild( handle );
		list.appendChild( row );

		return { item, row, handle };
	} );

	act( () => {
		hook.result.current.listProps.ref( list );

		bindings.forEach( ( { item, row, handle } ) => {
			hook.result.current.getItemProps( item.id ).ref( row );
			hook.result.current.getHandleProps( item.id ).ref( handle );
		} );
	} );

	const monitor =
		mockMonitor.mock.calls[ mockMonitor.mock.calls.length - 1 ][ 0 ];

	const registration = mockDraggable.mock.calls.find(
		( [ args ] ) => args.element === bindings[ 0 ].row
	)![ 0 ];

	const sourceData = registration.getInitialData!( {
		element: bindings[ 0 ].row,
		dragHandle: bindings[ 0 ].handle,
		input: dragInput,
	} );

	function event(
		sourceID = 'a',
		targetID: string | null = 'c',
		edge: 'top' | 'bottom' = 'bottom'
	) {
		return createDragEvent(
			{ ...sourceData, itemID: sourceID },
			targetID ? { ...sourceData, itemID: targetID } : null,
			edge
		);
	}

	function key( itemID: string, value: string ) {
		const preventDefault = jest.fn();

		act( () =>
			hook.result.current.getHandleProps( itemID ).onKeyDown!( {
				key: value,
				preventDefault,
				currentTarget: bindings.find(
					( binding ) => binding.item.id === itemID
				)!.handle,
			} as unknown as KeyboardEvent< HTMLButtonElement > )
		);

		return preventDefault;
	}

	function accept() {
		hook.rerender( {
			items: onChange.mock.calls[ onChange.mock.calls.length - 1 ][ 0 ],
			onChange,
		} );
	}

	return { ...hook, list, bindings, monitor, event, key, accept, onChange };
}

describe( 'useDraggableList', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		mockDraggable.mockReset().mockImplementation( () => jest.fn() );
		mockDropTarget.mockReset().mockImplementation( () => jest.fn() );
		mockMonitor.mockReset().mockImplementation( () => jest.fn() );
	} );

	afterEach( () => {
		document
			.querySelectorAll( '[data-draggable-test]' )
			.forEach( ( element ) => element.remove() );
	} );

	it( 'should register handles and sticky row targets with item and edge data', () => {
		const { list, bindings, event } = setup();

		bindings.forEach( ( { item, row, handle } ) => {
			expect( mockDraggable ).toHaveBeenCalledWith(
				expect.objectContaining( { element: row, dragHandle: handle } )
			);

			const registration = mockDropTarget.mock.calls.find(
				( [ args ] ) => args.element === row
			)![ 0 ];

			expect(
				registration.getIsSticky!( {
					element: row,
					input: dragInput,
					source: event().source,
				} )
			).toBe( true );

			const data = registration.getData!( {
				element: row,
				input: dragInput,
				source: event().source,
			} );

			expect( data ).toEqual(
				expect.objectContaining( {
					itemID: item.id,
					listToken: event().source.data.listToken,
				} )
			);

			expect( extractClosestEdge( data ) ).not.toBeNull();
		} );

		expect(
			mockDropTarget.mock.calls.find(
				( [ args ] ) => args.element === list
			)![ 0 ].getIsSticky
		).toBeUndefined();
	} );

	it.each( [
		{
			label: 'down one position',
			itemID: 'a',
			key: 'ArrowDown',
			expected: [ items[ 1 ], items[ 0 ], items[ 2 ] ],
		},
		{
			label: 'up one position',
			itemID: 'c',
			key: 'ArrowUp',
			expected: [ items[ 0 ], items[ 2 ], items[ 1 ] ],
		},
	] )(
		'should move an item $label with the keyboard',
		( { itemID, key, expected } ) => {
			const hook = setup();

			const preventDefault = hook.key( itemID, key );

			expect( preventDefault ).toHaveBeenCalledTimes( 1 );
			expect( hook.onChange ).toHaveBeenCalledTimes( 1 );
			expect( hook.onChange ).toHaveBeenCalledWith( expected );
			expect( items.map( getItemID ) ).toEqual( [ 'a', 'b', 'c' ] );
		}
	);

	it( 'should ignore boundary keys and leave other keys unhandled', () => {
		const hook = setup();

		expect( hook.key( 'a', 'ArrowUp' ) ).toHaveBeenCalledTimes( 1 );
		expect( hook.key( 'c', 'ArrowDown' ) ).toHaveBeenCalledTimes( 1 );
		expect( hook.key( 'a', 'Enter' ) ).not.toHaveBeenCalled();

		act( () => jest.runOnlyPendingTimers() );

		expect( hook.onChange ).not.toHaveBeenCalled();
		expect( hook.result.current.announcementText ).toBe( '' );
	} );

	it( 'should ignore moves to the same position, outside the list, or for a removed item', () => {
		const hook = setup();

		act( () => {
			hook.result.current.moveItem( 'a', 0 );
			hook.result.current.moveItem( 'a', -1 );
			hook.result.current.moveItem( 'a', items.length );
			hook.result.current.moveItem( 'removed', 0 );

			jest.runOnlyPendingTimers();
		} );

		expect( hook.onChange ).not.toHaveBeenCalled();
		expect( hook.result.current.announcementText ).toBe( '' );
	} );

	it.each( [
		{
			label: 'down to the last position',
			source: 'a',
			target: 'c',
			edge: 'bottom' as const,
			destinationIndex: 2,
			expected: [ items[ 1 ], items[ 2 ], items[ 0 ] ],
		},
		{
			label: 'up to the first position',
			source: 'c',
			target: 'a',
			edge: 'top' as const,
			destinationIndex: 0,
			expected: [ items[ 2 ], items[ 0 ], items[ 1 ] ],
		},
	] )(
		'should drag an item $label',
		( { source, target, edge, destinationIndex, expected } ) => {
			const hook = setup();
			const payload = hook.event( source, target, edge );

			act( () => hook.monitor.onDragStart!( payload ) );

			expect( hook.result.current.draggedItemID ).toBe( source );

			act( () => hook.monitor.onDrag!( payload ) );

			expect( hook.result.current.destinationIndex ).toBe(
				destinationIndex
			);

			act( () => hook.monitor.onDrop!( payload ) );

			expect( hook.onChange ).toHaveBeenCalledTimes( 1 );
			expect( hook.onChange ).toHaveBeenCalledWith( expected );
			expect( hook.result.current.draggedItemID ).toBeNull();
			expect( hook.result.current.destinationIndex ).toBeNull();

			hook.accept();
			act( () => jest.runOnlyPendingTimers() );

			expect( hook.result.current.announcementText ).toBe(
				`Moved to position ${ destinationIndex + 1 } of 3`
			);
		}
	);

	it( 'should retain a sticky destination in a gap and clear it outside the list', () => {
		const hook = setup();
		const payload = hook.event();

		payload.location.current.dropTargets[ 0 ].isActiveDueToStickiness =
			true;

		act( () => {
			hook.monitor.onDragStart!( payload );
			hook.monitor.onDropTargetChange!( payload );
		} );

		expect( hook.result.current.destinationIndex ).toBe( 2 );

		act( () =>
			hook.monitor.onDropTargetChange!( hook.event( 'a', null ) )
		);

		expect( hook.result.current.destinationIndex ).toBeNull();

		act( () => {
			hook.monitor.onDrop!( hook.event( 'a', null ) );
			jest.runOnlyPendingTimers();
		} );

		expect( hook.onChange ).not.toHaveBeenCalled();
		expect( hook.result.current.draggedItemID ).toBeNull();
		expect( hook.result.current.announcementText ).toBe( '' );
	} );

	it( 'should ignore a drop at the starting position', () => {
		const hook = setup();

		act( () => {
			hook.monitor.onDragStart!( hook.event() );
			hook.monitor.onDrop!( hook.event( 'a', 'a' ) );
			jest.runOnlyPendingTimers();
		} );

		expect( hook.onChange ).not.toHaveBeenCalled();
		expect( hook.result.current.announcementText ).toBe( '' );
		expect( hook.result.current.draggedItemID ).toBeNull();
	} );

	it( 'should reject other lists in monitors, targets, and destination calculation', () => {
		const hook = setup();
		const other = setup();
		const payload = other.event();

		expect( hook.result.current.instructionProps.id ).not.toBe(
			other.result.current.instructionProps.id
		);

		expect(
			hook.monitor.canMonitor!( {
				source: payload.source,
				initial: payload.location.initial,
			} )
		).toBe( false );

		expect(
			hook.monitor.canMonitor!( {
				source: hook.event().source,
				initial: payload.location.initial,
			} )
		).toBe( true );

		mockDropTarget.mock.calls
			.filter( ( [ args ] ) => hook.list.contains( args.element ) )
			.forEach( ( [ args ] ) => {
				expect(
					args.canDrop!( {
						source: payload.source,
						element: args.element,
						input: dragInput,
					} )
				).toBe( false );
			} );

		act( () => {
			hook.monitor.onDragStart!( hook.event() );
			hook.monitor.onDrag!( payload );
			hook.monitor.onDrop!( payload );
		} );

		expect( hook.onChange ).not.toHaveBeenCalled();
		expect( hook.result.current.destinationIndex ).toBeNull();
	} );

	it.each( [
		{ label: 'removed', updatedItems: items.slice( 1 ) },
		{
			label: 'reordered',
			updatedItems: [ items[ 1 ], items[ 0 ], items[ 2 ] ],
		},
		{
			label: 'added',
			updatedItems: [ ...items, { id: 'd', value: 'Delta' } ],
		},
	] )(
		'should cancel an active drag when items are $label by the parent',
		( { updatedItems } ) => {
			const hook = setup();

			act( () => {
				hook.monitor.onDragStart!( hook.event() );
				hook.monitor.onDrag!( hook.event() );
			} );

			hook.rerender( { items: updatedItems, onChange: hook.onChange } );

			expect( hook.result.current.draggedItemID ).toBeNull();
			expect( hook.result.current.destinationIndex ).toBeNull();

			act( () => hook.monitor.onDrop!( hook.event() ) );

			expect( hook.onChange ).not.toHaveBeenCalled();
		}
	);

	it( 'should use the latest values and callback when the parent updates during dragging', () => {
		const hook = setup();
		const onChange = jest.fn();

		act( () => hook.monitor.onDragStart!( hook.event() ) );

		const updatedItems = items.map( ( item ) => ( {
			...item,
			value: `${ item.value } updated`,
		} ) );

		hook.rerender( { items: updatedItems, onChange } );

		act( () => hook.monitor.onDrop!( hook.event() ) );

		expect( hook.onChange ).not.toHaveBeenCalled();

		expect( onChange ).toHaveBeenCalledWith( [
			updatedItems[ 1 ],
			updatedItems[ 2 ],
			updatedItems[ 0 ],
		] );
	} );

	it( 'should wait for parent acceptance before restoring focus and announcing', () => {
		const hook = setup();

		hook.bindings[ 2 ].handle.focus();
		hook.key( 'a', 'ArrowDown' );

		act( () => jest.runOnlyPendingTimers() );

		expect( hook.result.current.announcementText ).toBe( '' );
		expect( hook.bindings[ 2 ].handle ).toHaveFocus();

		hook.accept();

		expect( hook.bindings[ 0 ].handle ).toHaveFocus();
		expect( hook.result.current.announcementText ).toBe( '' );

		act( () => jest.runOnlyPendingTimers() );

		expect( hook.result.current.announcementText ).toBe(
			'Moved to position 2 of 3'
		);
	} );

	it( 'should focus the replacement handle when the initiating control detached', () => {
		const hook = setup();

		hook.key( 'a', 'ArrowDown' );

		const replacement = document.createElement( 'button' );

		hook.bindings[ 0 ].handle.replaceWith( replacement );

		act( () =>
			hook.result.current.getHandleProps( 'a' ).ref( replacement )
		);

		hook.accept();

		expect( replacement ).toHaveFocus();
	} );

	it( 'should clear and reinsert identical announcements', () => {
		const hook = setup();

		hook.key( 'a', 'ArrowDown' );
		hook.accept();

		act( () => jest.runOnlyPendingTimers() );

		expect( hook.result.current.announcementText ).toBe(
			'Moved to position 2 of 3'
		);

		hook.key( 'c', 'ArrowUp' );
		hook.accept();

		expect( hook.result.current.announcementText ).toBe( '' );

		act( () => jest.runOnlyPendingTimers() );

		expect( hook.result.current.announcementText ).toBe(
			'Moved to position 2 of 3'
		);
	} );

	it( 'should replace a pending announcement when another move is accepted', () => {
		const hook = setup();

		hook.key( 'c', 'ArrowUp' );
		hook.accept();

		act( () => jest.advanceTimersByTime( 50 ) );

		hook.key( 'c', 'ArrowUp' );
		hook.accept();

		act( () => jest.advanceTimersByTime( 50 ) );

		expect( hook.result.current.announcementText ).toBe( '' );

		act( () => jest.advanceTimersByTime( 50 ) );

		expect( hook.result.current.announcementText ).toBe(
			'Moved to position 1 of 3'
		);
	} );

	it( 'should leave announcements and focus alone for no-ops and unrelated parent updates', () => {
		const hook = setup();

		hook.key( 'a', 'ArrowDown' );
		hook.accept();

		act( () => jest.runOnlyPendingTimers() );

		hook.bindings[ 2 ].handle.focus();
		hook.key( 'c', 'ArrowDown' );

		hook.rerender( {
			items: [
				items[ 1 ],
				items[ 0 ],
				{ ...items[ 2 ], value: 'Updated' },
			],
			onChange: hook.onChange,
		} );

		expect( hook.bindings[ 2 ].handle ).toHaveFocus();

		expect( hook.result.current.announcementText ).toBe(
			'Moved to position 2 of 3'
		);
	} );

	it( 'should keep callback refs stable and rebuild registrations only for changed elements', () => {
		const hook = setup();
		const rowRef = hook.result.current.getItemProps( 'a' ).ref;
		const handleRef = hook.result.current.getHandleProps( 'a' ).ref;
		const listRef = hook.result.current.listProps.ref;
		const registrations = mockDraggable.mock.calls.length;

		act( () => {
			rowRef( hook.bindings[ 0 ].row );
			handleRef( hook.bindings[ 0 ].handle );
			listRef( hook.list );
		} );

		hook.rerender();

		expect( mockDraggable ).toHaveBeenCalledTimes( registrations );
		expect( hook.result.current.getItemProps( 'a' ).ref ).toBe( rowRef );

		expect( hook.result.current.getHandleProps( 'a' ).ref ).toBe(
			handleRef
		);

		expect( hook.result.current.listProps.ref ).toBe( listRef );

		const cleanups = mockDraggable.mock.results.map(
			( { value } ) => value
		);

		act( () => {
			rowRef( null );
			handleRef( null );
		} );

		cleanups.forEach( ( cleanup ) =>
			expect( cleanup ).toHaveBeenCalledTimes( 1 )
		);

		mockDraggable.mockClear();

		act( () => {
			rowRef( hook.bindings[ 0 ].row );
			handleRef( hook.bindings[ 0 ].handle );
		} );

		expect( mockDraggable ).toHaveBeenCalledWith(
			expect.objectContaining( {
				element: hook.bindings[ 0 ].row,
				dragHandle: hook.bindings[ 0 ].handle,
			} )
		);

		act( () => listRef( null ) );

		hook.unmount();

		[ mockDraggable, mockDropTarget, mockMonitor ].forEach( ( mock ) =>
			mock.mock.results.forEach( ( { value } ) =>
				expect( value ).toHaveBeenCalledTimes( 1 )
			)
		);
	} );

	it( 'should cancel its pending announcement timer on unmount', () => {
		const hook = setup();
		const setTimeoutSpy = jest.spyOn( global, 'setTimeout' );
		const clearTimeoutSpy = jest.spyOn( global, 'clearTimeout' );

		hook.key( 'a', 'ArrowDown' );
		hook.accept();

		const timer =
			setTimeoutSpy.mock.results[ setTimeoutSpy.mock.results.length - 1 ]
				.value;

		hook.unmount();

		expect( clearTimeoutSpy ).toHaveBeenCalledWith( timer );

		setTimeoutSpy.mockRestore();
		clearTimeoutSpy.mockRestore();
	} );
} );
