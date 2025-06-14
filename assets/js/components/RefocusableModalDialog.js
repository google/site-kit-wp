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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	SpinnerButton,
} from 'googlesitekit-components';
import ExclamationIcon from '../../svg/icons/warning.svg';

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
	className = '',
	dialogActive = false,
	handleDialog = null,
	onOpen = null,
	onClose = null,
	title = null,
	provides,
	handleConfirm,
	subtitle,
	confirmButton = null,
	dependentModules,
	danger = false,
	inProgress = false,
	small = false,
	medium = false,
	buttonLink = null,
	refocusQuerySelector = null,
} ) {
	const instanceID = useInstanceId( RefocusableModalDialog );
	const describedByID = `googlesitekit-dialog-description-${ instanceID }`;
	const hasProvides = !! ( provides && provides.length );

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

	// Handle re-focus of the button which triggered the modal.
	useEffect( () => {
		if ( ! dialogActive ) {
			handleElementRefocus();
		}

		return () => {
			// In majority of cases the modal is conditionally rendered, so dialogActive
			// will not be passed, as component will be unmounted/removed from the DOM.
			handleElementRefocus();
		};
	}, [ dialogActive, handleElementRefocus ] );

	return (
		<Dialog
			open={ dialogActive }
			onOpen={ onOpen }
			onClose={ onClose }
			aria-describedby={ hasProvides ? describedByID : undefined }
			tabIndex="-1"
			className={ classnames( className, {
				'googlesitekit-dialog-sm': small,
				'googlesitekit-dialog-md': medium,
			} ) }
			// Prevent default modal behavior since we are capturing the escape key and scrim click.
		>
			<DialogTitle>
				{ danger && <ExclamationIcon width={ 28 } height={ 28 } /> }
				{ title }
			</DialogTitle>
			{
				// Ensure we don't render anything at all if subtitle is falsy, as Dialog expects all its children to be elements and a falsy value will result in an error.
				subtitle ? <p className="mdc-dialog__lead">{ subtitle }</p> : []
			}
			<DialogContent>
				{ hasProvides && (
					<section
						id={ describedByID }
						className="mdc-dialog__provides"
					>
						<ul className="mdc-list mdc-list--underlined mdc-list--non-interactive">
							{ provides.map( ( attribute ) => (
								<li className="mdc-list-item" key={ attribute }>
									<span className="mdc-list-item__text">
										{ attribute }
									</span>
								</li>
							) ) }
						</ul>
					</section>
				) }
				{ dependentModules && (
					<p className="mdc-dialog__dependencies">
						{ createInterpolateElement(
							sprintf(
								/* translators: %s is replaced with the dependent modules. */
								__(
									'<strong>Note:</strong> %s',
									'google-site-kit'
								),
								dependentModules
							),
							{
								strong: <strong />,
							}
						) }
					</p>
				) }
			</DialogContent>
			<DialogFooter>
				<Button
					className="mdc-dialog__cancel-button"
					tertiary
					onClick={ handleDialog }
					disabled={ inProgress }
				>
					{ __( 'Cancel', 'google-site-kit' ) }
				</Button>
				{ buttonLink ? (
					<Button
						href={ buttonLink }
						onClick={ handleConfirm }
						target="_blank"
						danger={ danger }
					>
						{ confirmButton }
					</Button>
				) : (
					<SpinnerButton
						onClick={ handleConfirm }
						danger={ danger }
						disabled={ inProgress }
						isSaving={ inProgress }
					>
						{ confirmButton ||
							__( 'Disconnect', 'google-site-kit' ) }
					</SpinnerButton>
				) }
			</DialogFooter>
		</Dialog>
	);
}

RefocusableModalDialog.displayName = 'Dialog';

RefocusableModalDialog.propTypes = {
	className: PropTypes.string,
	dialogActive: PropTypes.bool,
	handleDialog: PropTypes.func,
	handleConfirm: PropTypes.func.isRequired,
	onOpen: PropTypes.func,
	onClose: PropTypes.func,
	title: PropTypes.string,
	confirmButton: PropTypes.string,
	danger: PropTypes.bool,
	small: PropTypes.bool,
	medium: PropTypes.bool,
	buttonLink: PropTypes.string,
	refocusQuerySelector: PropTypes.string,
};

export default RefocusableModalDialog;
