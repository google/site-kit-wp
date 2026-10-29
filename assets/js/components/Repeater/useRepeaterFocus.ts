/**
 * `useRepeaterFocus` hook.
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
import { RefCallback } from 'react';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';

export type RepeaterInputElement =
	| HTMLInputElement
	| HTMLTextAreaElement
	| HTMLSelectElement;

interface InputBinding {
	element: RepeaterInputElement | null;
	ref: RefCallback< RepeaterInputElement >;
}

interface PendingFocus {
	initialIDs: string[];
	expectedIDs: string[];
	itemID: string | null;
}

/**
 * Manages input refs and focus after a controlled Repeater accepts item changes.
 *
 * @since n.e.x.t
 *
 * @param {Array} itemIDs Current ordered item IDs.
 * @return {Object} Input ref getter, Add button ref, and focus request functions.
 */
export default function useRepeaterFocus( itemIDs: string[] ) {
	const addButtonRef = useRef< HTMLButtonElement >( null );
	const bindingsRef = useRef( new Map< string, InputBinding >() );
	const currentIDsRef = useRef( itemIDs );
	const pendingFocusRef = useRef< PendingFocus | null >( null );

	function getInputRef(
		itemID: string
	): RefCallback< RepeaterInputElement > {
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

		return binding.ref;
	}

	function requestFocusAfterAdd( itemID: string ) {
		const ids = currentIDsRef.current;

		pendingFocusRef.current = {
			initialIDs: ids,
			expectedIDs: [ ...ids, itemID ],
			itemID,
		};
	}

	function requestFocusAfterRemove( itemID: string ) {
		const ids = currentIDsRef.current;
		const index = ids.indexOf( itemID );

		if ( index === -1 ) {
			return;
		}

		pendingFocusRef.current = {
			initialIDs: ids,
			expectedIDs: ids.filter( ( _, itemIndex ) => itemIndex !== index ),
			itemID: ids[ index - 1 ] ?? ids[ index + 1 ] ?? null,
		};
	}

	useLayoutEffect( () => {
		currentIDsRef.current = itemIDs;

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

	return {
		addButtonRef,
		getInputRef,
		requestFocusAfterAdd,
		requestFocusAfterRemove,
	};
}
