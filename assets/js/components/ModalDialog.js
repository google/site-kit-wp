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
} ) {
	const instanceID = useInstanceId( ModalDialog );
	const describedByID = `googlesitekit-dialog-description-${ instanceID }`;
	const hasProvides = !! ( provides && provides.length );

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
};

export default ModalDialog;
