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
import { createInterpolateElement } from '@wordpress/element';
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
import useDialogEscapeAndScrim from '../hooks/useDialogEscapeAndScrim';

// eslint-disable-next-line no-console
const log = console.log;

// Use a singleton variable to store the clicked element before any dialog opens.
// We need to do this at the module level since the component may not be mounted
// when the user initiates an action that will open the dialog.
// Using WeakRef to prevent memory leaks if the element is removed from the DOM.
let previouslyClickedElementRef = null;

// Set up a global event listener to capture the clicked element before any dialog opens
// This needs to happen at the module level to ensure it's set up before any user interaction
if (
	typeof global !== 'undefined' &&
	global.document &&
	! global._googlesitekitModalFocusTrackerInitialized
) {
	const captureActiveElementOnClick = ( event ) => {
		log( 'event', event );

		// Store the clicked (or keyboard-activated) element when user clicks.
		// This will be the element that was clicked right before the dialog opens.
		// We'll assume that the user will always click a button or anchor, although
		// may need to revisit this assumption.
		const nearestParentButtonOrAnchor = event.target.closest( 'button, a' );
		if ( nearestParentButtonOrAnchor ) {
			// eslint-disable-next-line no-undef
			previouslyClickedElementRef = new WeakRef(
				nearestParentButtonOrAnchor
			);
		}
		log( 'previouslyActiveElement', previouslyClickedElementRef?.deref() );
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

function ModalDialog( {
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
	refocusPreviousElement = false,
	refocusQuerySelector = null,
} ) {
	const instanceID = useInstanceId( ModalDialog );
	const describedByID = `googlesitekit-dialog-description-${ instanceID }`;
	const hasProvides = !! ( provides && provides.length );

	const shouldRefocus = refocusQuerySelector || refocusPreviousElement;

	const handleEscapeOrScrim = () => {
		if ( shouldRefocus ) {
			// Handle onClose as setting key action props on Dialog prevents these from being called.
			onClose?.();
			// Refocus the passed querySelector.
			setTimeout( () => {
				if ( refocusPreviousElement ) {
					const previouslyClickedElement =
						previouslyClickedElementRef?.deref();
					if (
						previouslyClickedElement &&
						document.body.contains( previouslyClickedElement )
					) {
						previouslyClickedElement.focus();
					}
					// Clear the reference so it doesn't persist indefinitely.
					previouslyClickedElementRef = null;
				} else {
					const element =
						document.querySelector( refocusQuerySelector );
					if ( element ) {
						element.focus();
					}
				}
			} );
		}
	};

	// Override the escape and scrim click actions if refocusQuerySelector is set.
	useDialogEscapeAndScrim(
		handleEscapeOrScrim,
		dialogActive && shouldRefocus
	);

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
			// Prevent default modal behavior if we are capturing the escape key and scrim click.
			escapeKeyAction={ shouldRefocus ? '' : 'close' }
			scrimClickAction={ shouldRefocus ? '' : 'close' }
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

ModalDialog.displayName = 'Dialog';

ModalDialog.propTypes = {
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
	refocusPreviousElement: PropTypes.bool,
	refocusQuerySelector: PropTypes.string,
};

export default ModalDialog;
