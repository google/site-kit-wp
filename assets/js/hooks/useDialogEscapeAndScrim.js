/**
 * Dialog Escape and Scrim Click hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useKey } from 'react-use';
import { useEffect } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Hook to handle dialog escape key press and scrim click for a MD2 Dialog.
 *
 * NOTE: You must set escapeKeyAction and scrimClickAction to an empty string ("") to disable the
 * default behavior of the Dialog component for these hook events to take precedence.
 *
 * @since n.e.x.t
 *
 * @param {Function} callback Callback function to execute on escape key press or scrim click.
 * @param {boolean}  active   Optional. Condition to determine if the callback should be executed. Default true.
 */
export default function useDialogEscapeAndScrim( callback, active = true ) {
	// Handle escape key press.
	useKey(
		( event ) => active && ESCAPE === event.keyCode,
		() => {
			callback();
		}
	);

	// Handle clicking on the scrim (outside the dialog).
	useEffect( () => {
		if ( ! active ) {
			return;
		}

		const handleScrimClick = ( event ) => {
			if ( event.target.classList.contains( 'mdc-dialog__scrim' ) ) {
				callback();
			}
		};

		document.addEventListener( 'click', handleScrimClick );

		return () => {
			document.removeEventListener( 'click', handleScrimClick );
		};
	}, [ active, callback ] );
}
