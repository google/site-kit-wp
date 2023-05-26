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
import { useInstanceId } from '@wordpress/compose';
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton, Dialog } from 'googlesitekit-components';
import Link from './Link';

const ModalDialog = ( {
	dialogActive,
	handleDialog,
	title,
	provides,
	handleConfirm,
	subtitle,
	confirmButton,
	dependentModules,
	danger,
	inProgress = false,
} ) => {
	// eslint-disable-next-line sitekit/acronym-case
	const instanceID = useInstanceId( ModalDialog );
	const describedByID = `googlesitekit-dialog-description-${ instanceID }`;
	const hasProvides = !! ( provides && provides.length );

	return (
		<Dialog
			open={ dialogActive }
			// TODO: Pass aria-describedby through in Dialog.
			aria-describedby={ hasProvides ? describedByID : undefined }
			title={ title }
			content={
				<Fragment>
					{ subtitle && (
						<p className="mdc-dialog__lead">{ subtitle }</p>
					) }
					{ hasProvides && (
						<section
							id={ describedByID }
							className="mdc-dialog__content"
						>
							<ul className="mdc-list mdc-list--underlined mdc-list--non-interactive">
								{ provides.map( ( attribute ) => (
									<li
										className="mdc-list-item"
										key={ attribute }
									>
										<span className="mdc-list-item__text">
											{ attribute }
										</span>
									</li>
								) ) }
							</ul>
						</section>
					) }
					{ dependentModules && (
						<p className="mdc-dialog__dependecies">
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
				</Fragment>
			}
			footer={
				<Fragment>
					<SpinnerButton
						onClick={ handleConfirm }
						danger={ danger }
						disabled={ inProgress }
						isSaving={ inProgress }
					>
						{ confirmButton
							? confirmButton
							: __( 'Disconnect', 'google-site-kit' ) }
					</SpinnerButton>
					<Link
						className="googlesitekit-margin-left-auto mdc-dialog__cancel-button"
						onClick={ handleDialog }
						disabled={ inProgress }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Link>
				</Fragment>
			}
		/>
	);
};

ModalDialog.displayName = 'Dialog';

ModalDialog.propTypes = {
	dialogActive: PropTypes.bool,
	handleDialog: PropTypes.func,
	handleConfirm: PropTypes.func.isRequired,
	title: PropTypes.string,
	description: PropTypes.string,
	confirmButton: PropTypes.string,
	danger: PropTypes.bool,
};

ModalDialog.defaultProps = {
	dialogActive: false,
	handleDialog: null,
	title: null,
	description: null,
	confirmButton: null,
	danger: false,
};

export default ModalDialog;
