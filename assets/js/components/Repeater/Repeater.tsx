/**
 * Repeater component.
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
import classnames from 'classnames';
import { ReactNode, RefCallback } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, useLayoutEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AddButton from './AddButton';
import RemoveButton from './RemoveButton';
import { RemoveButtonContext } from './RemoveButtonContext';
import { RepeaterContext } from './RepeaterContext';

export type RepeaterInputElement =
	| HTMLInputElement
	| HTMLTextAreaElement
	| HTMLSelectElement;

export interface RepeaterFieldRenderOptions< Item > {
	item: Item;
	/** Replace the complete item, retaining its stable ID. */
	updateItem( updatedItem: Item ): void;
	/** Attach to the actual form control; custom fields must forward this ref. */
	inputRef: RefCallback< RepeaterInputElement >;
	/** Render after the field to allow removal, including the final entry. */
	RemoveButton: typeof RemoveButton;
}

export interface RepeaterListRenderOptions< Item > {
	renderField( item: Item, index: number ): ReactNode;
	AddButton: typeof AddButton;
}

export interface RepeaterProps< Item > {
	/** The parent owns both the entry values and their displayed order. */
	items: Item[];
	/** Return a unique ID that remains stable across edits and reordering. */
	getItemID( item: Item ): string;
	/** Create an empty entry with a new unique ID for the insertion index. */
	getNewItem( index: number ): Item;
	/** Receive the complete updated array after an addition, removal, or edit. */
	onChange( items: Item[] ): void;
	maxItems: number;
	renderField(
		options: RepeaterFieldRenderOptions< Item >,
		index: number
	): ReactNode;
	/**
	 * Render the current entries in order and one AddButton below them.
	 * Key any row wrappers by stable item ID. Omit to use the default layout.
	 */
	renderList?( options: RepeaterListRenderOptions< Item > ): ReactNode;
	className?: string;
}

interface InputBinding {
	element: RepeaterInputElement | null;
	ref: RefCallback< RepeaterInputElement >;
}

interface PendingFocus {
	initialIDs: string[];
	expectedIDs: string[];
	itemID: string | null;
}

function Repeater< Item >( {
	className,
	getItemID,
	getNewItem,
	items,
	maxItems,
	onChange,
	renderField,
	renderList,
}: RepeaterProps< Item > ) {
	const itemIDs = items.map( getItemID );

	const addButtonRef = useRef< HTMLButtonElement >( null );
	const bindingsRef = useRef( new Map< string, InputBinding >() );
	const pendingFocusRef = useRef< PendingFocus | null >( null );

	const currentDataRef = useRef( {
		items,
		getItemID,
		getNewItem,
		onChange,
		maxItems,
	} );

	useLayoutEffect( () => {
		currentDataRef.current = {
			items,
			getItemID,
			getNewItem,
			onChange,
			maxItems,
		};

		bindingsRef.current.forEach( ( binding, itemID ) => {
			if ( ! itemIDs.includes( itemID ) ) {
				bindingsRef.current.delete( itemID );
			}
		} );

		const pendingFocus = pendingFocusRef.current;

		if ( ! pendingFocus ) {
			return;
		}

		function matchesOrder( ids: string[] ) {
			return (
				ids.length === itemIDs.length &&
				ids.every( ( id, index ) => id === itemIDs[ index ] )
			);
		}

		if ( matchesOrder( pendingFocus.expectedIDs ) ) {
			const element =
				pendingFocus.itemID === null
					? addButtonRef.current
					: bindingsRef.current.get( pendingFocus.itemID )?.element;

			if ( element ) {
				element.focus();
				pendingFocusRef.current = null;
			}
		} else if ( ! matchesOrder( pendingFocus.initialIDs ) ) {
			// A different structural change supersedes this request. Value-only
			// updates may arrive while the parent is still deferring the change.
			pendingFocusRef.current = null;
		}
	} );

	function addItem() {
		const current = currentDataRef.current;

		if ( current.items.length >= current.maxItems ) {
			return;
		}

		const newItem = current.getNewItem( current.items.length );
		const nextItems = [ ...current.items, newItem ];

		pendingFocusRef.current = {
			initialIDs: current.items.map( current.getItemID ),
			expectedIDs: nextItems.map( current.getItemID ),
			itemID: current.getItemID( newItem ),
		};

		current.onChange( nextItems );
	}

	function removeItem( itemID: string ) {
		const current = currentDataRef.current;

		const ids = current.items.map( current.getItemID );
		const index = ids.indexOf( itemID );

		if ( index === -1 ) {
			return;
		}

		const nextItems = current.items.filter(
			( _, itemIndex ) => itemIndex !== index
		);

		pendingFocusRef.current = {
			initialIDs: ids,
			expectedIDs: nextItems.map( current.getItemID ),
			itemID: ids[ index - 1 ] ?? ids[ index + 1 ] ?? null,
		};

		current.onChange( nextItems );
	}

	function updateItem( itemID: string, updatedItem: Item ) {
		const current = currentDataRef.current;

		const index = current.items.findIndex(
			( item ) => current.getItemID( item ) === itemID
		);

		if ( index === -1 || current.getItemID( updatedItem ) !== itemID ) {
			return;
		}

		const nextItems = [ ...current.items ];

		nextItems[ index ] = updatedItem;

		current.onChange( nextItems );
	}

	function renderItemField( item: Item, index: number ) {
		const itemID = getItemID( item );

		let binding = bindingsRef.current.get( itemID );

		if ( ! binding ) {
			const newBinding: InputBinding = {
				element: null,
				ref: ( element ) => {
					newBinding.element = element;
				},
			};

			bindingsRef.current.set( itemID, newBinding );

			binding = newBinding;
		}

		return (
			<RemoveButtonContext.Provider
				key={ itemID }
				value={ { removeItem: () => removeItem( itemID ) } }
			>
				{ renderField(
					{
						item,
						updateItem: ( updatedItem ) =>
							updateItem( itemID, updatedItem ),
						inputRef: binding.ref,
						RemoveButton,
					},
					index
				) }
			</RemoveButtonContext.Provider>
		);
	}

	return (
		<div className={ classnames( 'googlesitekit-repeater', className ) }>
			<RepeaterContext.Provider
				value={ {
					addButtonRef,
					addItem,
					isAtMaximum: items.length >= maxItems,
				} }
			>
				{ renderList ? (
					renderList( { renderField: renderItemField, AddButton } )
				) : (
					<Fragment>
						{ items.map( renderItemField ) }

						<AddButton>
							{ __( 'Add', 'google-site-kit' ) }
						</AddButton>
					</Fragment>
				) }
			</RepeaterContext.Provider>
		</div>
	);
}

export default Repeater;
