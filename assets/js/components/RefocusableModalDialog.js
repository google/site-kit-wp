/**
 * ModalDialog component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { Dialog } from 'googlesitekit-components';
import ModalDialog from './ModalDialog';

// Use a singleton variable to store the clicked element before any dialog opens.
// We need to do this at the module level since the component may not be mounted
// when the user initiates an action that will open the dialog.
let previouslyClickedElement = null;

// Set up a global event listener to capture the clicked element before any dialog opens.
// This needs to happen at the module level to ensure it's set up before any user interaction.
function setupFocusTracker() {
	if (
		typeof global === 'undefined' ||
		! global.document ||
		global._googlesitekitModalFocusTrackerInitialized
	) {
		return;
	}

	const captureActiveElementOnClick = ( event ) => {
		// Store the clicked (or keyboard-activated) element when user clicks.
		// This will be the element that was clicked right before the dialog opens.
		const nearestParentButtonOrAnchor =
			event.target.closest( 'button, a, input' );
		if (
			nearestParentButtonOrAnchor &&
			! nearestParentButtonOrAnchor.classList.contains(
				'mdc-dialog__cancel-button'
			)
		) {
			previouslyClickedElement = nearestParentButtonOrAnchor;
		}
	};

	global.document.addEventListener(
		'mousedown',
		captureActiveElementOnClick
	);

	global.document.addEventListener( 'keydown', ( event ) => {
		if ( event.key === 'Enter' || event.key === ' ' ) {
			captureActiveElementOnClick( event );
		}
	} );

	global._googlesitekitModalFocusTrackerInitialized = true;
}

setupFocusTracker();

function RefocusableModalDialog( {
	dialogActive = false,
	refocusQuerySelector = null,
	...modalDialogProps
} ) {
	const handleElementRefocus = useCallback( () => {
		setTimeout( () => {
			const elementToFocus = refocusQuerySelector
				? document.querySelector( refocusQuerySelector )
				: previouslyClickedElement;

			if ( elementToFocus && document.body.contains( elementToFocus ) ) {
				elementToFocus.focus();
			}

			if ( ! refocusQuerySelector ) {
				previouslyClickedElement = null;
			}
		} );
	}, [ refocusQuerySelector ] );

	const previousDialogActive = usePrevious( dialogActive );
	// Handle re-focus of the button which triggered the modal.
	useEffect( () => {
		if ( previousDialogActive === true && dialogActive === false ) {
			handleElementRefocus();
		}

		return () => {
			// In majority of cases the modal is conditionally rendered, so dialogActive
			// will not be passed, as component will be unmounted/removed from the DOM.
			handleElementRefocus();
		};
	}, [ previousDialogActive, dialogActive, handleElementRefocus ] );

	return (
		<ModalDialog dialogActive={ dialogActive } { ...modalDialogProps } />
	);
}

RefocusableModalDialog.propTypes = {
	dialogActive: PropTypes.bool,
	refocusQuerySelector: PropTypes.string,
	...Dialog.propTypes,
};

export default RefocusableModalDialog;
