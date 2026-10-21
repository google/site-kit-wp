/**
 * `useDraggableList` hook.
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

/* eslint-disable sitekit/acronym-case -- Native DOM type names. */

/**
 * External dependencies
 */
import {
	attachClosestEdge,
	extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import {
	ElementEventBasePayload,
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter';
import { ButtonHTMLAttributes, HTMLAttributes, RefCallback } from 'react';
import { useUnmount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

export interface UseDraggableListOptions< Item > {
	/** Current ordered items, owned by the consumer. */
	items: Item[];
	/** Return a unique ID that remains stable when the item moves or changes. */
	getItemID: ( item: Item ) => string;
	/** Supply this order back through items to accept a requested move. */
	onChange: ( items: Item[] ) => void;
}

export interface HandleProps extends ButtonHTMLAttributes< HTMLButtonElement > {
	ref: RefCallback< HTMLButtonElement >;
}

export interface ItemProps extends HTMLAttributes< HTMLLIElement > {
	ref: RefCallback< HTMLLIElement >;
}

interface ItemBinding {
	rowElement: HTMLLIElement | null;
	handleElement: HTMLButtonElement | null;
	rowRef: RefCallback< HTMLLIElement >;
	handleRef: RefCallback< HTMLButtonElement >;
}

interface ActiveDrag {
	itemID: string;
	initialItemIDs: string[];
}

interface PendingMove {
	itemID: string;
	expectedItemIDs: string[];
	focusElement: HTMLElement | null;
}

/**
 * Provides drag-and-drop and keyboard reordering for a controlled list.
 *
 * @since n.e.x.t
 *
 * @param {Object}   options           List options.
 * @param {Array}    options.items     Current ordered items.
 * @param {Function} options.getItemID Returns each item's stable, unique ID.
 * @param {Function} options.onChange  Receives the complete reordered array.
 * @return {Object} Prop getters, drag state, and accessibility announcements.
 */
export default function useDraggableList< Item >( {
	items,
	getItemID,
	onChange,
}: UseDraggableListOptions< Item > ) {
	const itemIDs = useMemo(
		() => items.map( getItemID ),
		[ items, getItemID ]
	);

	const instructionID = String(
		useInstanceId(
			useDraggableList,
			'googlesitekit-draggable-list-instructions'
		)
	);

	const [ announcementText, setAnnouncementText ] = useState( '' );
	const [ elementsRevision, setElementsRevision ] = useState( 0 );
	const [ listToken ] = useState( () => Symbol( 'DraggableList' ) );

	const [ draggedItemID, setDraggedItemID ] = useState< string | null >(
		null
	);

	const [ destinationIndex, setDestinationIndex ] = useState< number | null >(
		null
	);

	const listElementRef = useRef< HTMLOListElement | null >( null );
	const itemBindingsRef = useRef( new Map< string, ItemBinding >() );
	const currentDataRef = useRef( { items, itemIDs, onChange } );
	const activeDragRef = useRef< ActiveDrag | null >( null );
	const pendingMoveRef = useRef< PendingMove | null >( null );
	const announcementTimerRef = useRef< ReturnType<
		typeof setTimeout
	> | null >( null );

	function getItemBinding( itemID: string ): ItemBinding {
		const existingBinding = itemBindingsRef.current.get( itemID );

		if ( existingBinding ) {
			return existingBinding;
		}

		const binding: ItemBinding = {
			rowElement: null,
			handleElement: null,
			rowRef: ( element ) => {
				if ( binding.rowElement !== element ) {
					binding.rowElement = element;
					setElementsRevision( ( revision ) => revision + 1 );
				}
			},
			handleRef: ( element ) => {
				if ( binding.handleElement !== element ) {
					binding.handleElement = element;
					setElementsRevision( ( revision ) => revision + 1 );
				}
			},
		};

		itemBindingsRef.current.set( itemID, binding );

		return binding;
	}

	const captureListElement = useCallback(
		( element: HTMLOListElement | null ) => {
			if ( listElementRef.current !== element ) {
				listElementRef.current = element;
				setElementsRevision( ( revision ) => revision + 1 );
			}
		},
		[]
	);

	const moveItem = useCallback(
		(
			itemID: string,
			nextIndex: number,
			focusElement: HTMLElement | null = null
		) => {
			const current = currentDataRef.current;
			const index = current.itemIDs.indexOf( itemID );

			if (
				index === -1 ||
				! Number.isInteger( nextIndex ) ||
				nextIndex < 0 ||
				nextIndex >= current.items.length ||
				nextIndex === index
			) {
				return;
			}

			const reordered = [ ...current.items ];
			const [ item ] = reordered.splice( index, 1 );

			reordered.splice( nextIndex, 0, item );

			const expectedItemIDs = [ ...current.itemIDs ];

			expectedItemIDs.splice( index, 1 );
			expectedItemIDs.splice( nextIndex, 0, itemID );

			pendingMoveRef.current = { itemID, expectedItemIDs, focusElement };

			current.onChange( reordered );
		},
		[]
	);

	function getHandleProps( itemID: string ): HandleProps {
		return {
			'aria-describedby': instructionID,
			onKeyDown: ( event ) => {
				if ( event.key !== 'ArrowUp' && event.key !== 'ArrowDown' ) {
					return;
				}

				event.preventDefault();

				const index = itemIDs.indexOf( itemID );

				moveItem(
					itemID,
					index + ( event.key === 'ArrowUp' ? -1 : 1 ),
					event.currentTarget
				);
			},
			ref: getItemBinding( itemID ).handleRef,
			type: 'button',
		};
	}

	function getItemProps( itemID: string ): ItemProps {
		return { ref: getItemBinding( itemID ).rowRef };
	}

	useLayoutEffect( () => {
		const previousItemIDs = currentDataRef.current.itemIDs;

		currentDataRef.current = { items, itemIDs, onChange };

		const activeDrag = activeDragRef.current;

		if (
			activeDrag &&
			( activeDrag.initialItemIDs.length !== itemIDs.length ||
				activeDrag.initialItemIDs.some(
					( id, index ) => id !== itemIDs[ index ]
				) )
		) {
			activeDragRef.current = null;
			setDraggedItemID( null );
			setDestinationIndex( null );
		}

		const pendingMove = pendingMoveRef.current;

		if ( ! pendingMove ) {
			return;
		}

		if (
			pendingMove.expectedItemIDs.length !== itemIDs.length ||
			pendingMove.expectedItemIDs.some(
				( id, index ) => id !== itemIDs[ index ]
			)
		) {
			// A different structural update supersedes the requested move.
			if (
				previousItemIDs.length !== itemIDs.length ||
				previousItemIDs.some( ( id, index ) => id !== itemIDs[ index ] )
			) {
				pendingMoveRef.current = null;
			}

			return;
		}

		pendingMoveRef.current = null;

		// Dragging should not steal focus from another control.
		if ( pendingMove.focusElement ) {
			const focusElement = pendingMove.focusElement.isConnected
				? pendingMove.focusElement
				: itemBindingsRef.current.get( pendingMove.itemID )
						?.handleElement;

			focusElement?.focus();
		}

		if ( announcementTimerRef.current !== null ) {
			clearTimeout( announcementTimerRef.current );
		}

		setAnnouncementText( '' );

		const message = sprintf(
			/* translators: 1: New item position, 2: Total number of items. */
			__( 'Moved to position %1$d of %2$d', 'google-site-kit' ),
			itemIDs.indexOf( pendingMove.itemID ) + 1,
			itemIDs.length
		);

		announcementTimerRef.current = setTimeout( () => {
			setAnnouncementText( message );

			announcementTimerRef.current = null;
		}, 100 );
	}, [ items, itemIDs, onChange ] );

	useUnmount( () => {
		if ( announcementTimerRef.current !== null ) {
			clearTimeout( announcementTimerRef.current );
		}
	} );

	useEffect( () => {
		const cleanupFunctions: Array< () => void > = [];
		const listElement = listElementRef.current;

		if ( listElement ) {
			const dropTargetCleanup = dropTargetForElements( {
				canDrop: ( { source } ) => source.data.listToken === listToken,
				element: listElement,
			} );

			cleanupFunctions.push( dropTargetCleanup );
		}

		currentDataRef.current.itemIDs.forEach( ( itemID ) => {
			const binding = itemBindingsRef.current.get( itemID );

			if ( ! binding?.rowElement || ! binding.handleElement ) {
				return;
			}

			const draggableCleanup = draggable( {
				element: binding.rowElement,
				dragHandle: binding.handleElement,
				canDrag: () => ! binding.handleElement?.disabled,
				getInitialData: () => ( { itemID, listToken } ),
			} );

			const dropTargetCleanup = dropTargetForElements( {
				element: binding.rowElement,
				canDrop: ( { source } ) => source.data.listToken === listToken,
				getIsSticky: () => true,
				getData: ( { element, input } ) =>
					attachClosestEdge(
						{ itemID, listToken },
						{
							element,
							input,
							allowedEdges: [ 'top', 'bottom' ],
						}
					),
			} );

			cleanupFunctions.push( draggableCleanup );
			cleanupFunctions.push( dropTargetCleanup );
		} );

		function getDestination(
			location: ElementEventBasePayload[ 'location' ]
		) {
			const activeDrag = activeDragRef.current;

			if ( ! activeDrag ) {
				return null;
			}

			const target = location.current.dropTargets.find(
				( { data } ) =>
					data.listToken === listToken &&
					typeof data.itemID === 'string'
			);

			if ( ! target ) {
				return null;
			}

			const currentIDs = currentDataRef.current.itemIDs;
			const startIndex = currentIDs.indexOf( activeDrag.itemID );

			const indexOfTarget = currentIDs.indexOf(
				target.data.itemID as string
			);

			const closestEdgeOfTarget = extractClosestEdge( target.data );

			if (
				startIndex === -1 ||
				indexOfTarget === -1 ||
				! closestEdgeOfTarget
			) {
				return null;
			}

			return getReorderDestinationIndex( {
				startIndex,
				indexOfTarget,
				closestEdgeOfTarget,
				axis: 'vertical',
			} );
		}

		function updateDestination( { location }: ElementEventBasePayload ) {
			setDestinationIndex( getDestination( location ) );
		}

		const monitorCleanup = monitorForElements( {
			canMonitor: ( { source } ) => source.data.listToken === listToken,
			onDragStart: ( { source } ) => {
				const itemID = source.data.itemID;

				if (
					typeof itemID !== 'string' ||
					! currentDataRef.current.itemIDs.includes( itemID )
				) {
					return;
				}

				activeDragRef.current = {
					itemID,
					initialItemIDs: [ ...currentDataRef.current.itemIDs ],
				};

				setDraggedItemID( itemID );
			},
			onDrag: updateDestination,
			onDropTargetChange: updateDestination,
			onDrop: ( { location } ) => {
				const activeDrag = activeDragRef.current;
				const nextIndex = getDestination( location );

				if ( activeDrag && nextIndex !== null ) {
					moveItem( activeDrag.itemID, nextIndex, null );
				}

				activeDragRef.current = null;

				setDraggedItemID( null );
				setDestinationIndex( null );
			},
		} );

		cleanupFunctions.push( monitorCleanup );

		itemBindingsRef.current.forEach( ( binding, itemID ) => {
			if ( ! currentDataRef.current.itemIDs.includes( itemID ) ) {
				itemBindingsRef.current.delete( itemID );
			}
		} );

		return () => cleanupFunctions.forEach( ( cleanup ) => cleanup() );
	}, [ elementsRevision, listToken, moveItem ] );

	return {
		listProps: { ref: captureListElement },
		getItemProps,
		getHandleProps,
		draggedItemID,
		destinationIndex,
		moveItem,
		instructionText: __(
			'Use the Up and Down arrow keys to move this item.',
			'google-site-kit'
		),
		instructionProps: { id: instructionID },
		announcementText,
		announcementProps: {
			'aria-live': 'polite' as const,
			'aria-atomic': true as const,
		},
	};
}
