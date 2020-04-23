/**
 * Dialog component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import FocusTrap from 'focus-trap-react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { Component, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from './button';
import Link from './link';
import { MDCDialog } from '../material-components';

class Dialog extends Component {
	constructor() {
		super();

		this.state = { /* TODO: Update state with real data based on module */
			attributes: [
				__( 'Audience overview', 'google-site-kit' ),
				__( 'Top pages', 'google-site-kit' ),
				__( 'Top acquisition sources', 'google-site-kit' ),
				__( 'AdSense & Analytics metrics for top pages', 'google-site-kit' ),
			],
		};

		this.dialogRef = createRef();
	}

	componentDidMount() {
		new MDCDialog( this.dialogRef.current );
	}

	render() {
		const {
			dialogActive,
			handleDialog,
			title,
			provides,
			handleConfirm,
			subtitle,
			confirmButton,
			dependentModules,
			instanceId,
		} = this.props;

		const labelledByID = `googlesitekit-dialog-label-${ instanceId }`;
		const describedByID = `googlesitekit-dialog-description-${ instanceId }`;
		const hasProvides = !! ( provides && provides.length );

		return (
			<div
				ref={ this.dialogRef }
				className={ classnames(
					'mdc-dialog',
					{ 'mdc-dialog--open': dialogActive }
				) }
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={ title ? labelledByID : undefined }
				aria-describedby={ hasProvides ? describedByID : undefined }
				aria-hidden={ dialogActive ? 'false' : 'true' }
				tabIndex="-1"
			>
				<div className="mdc-dialog__scrim">&nbsp;</div>
				<FocusTrap active={ dialogActive } >
					<div>
						<div className="mdc-dialog__container">
							<div className="mdc-dialog__surface">
								{ title &&
									<h2 id={ labelledByID } className="mdc-dialog__title">
										{ title }
									</h2>
								}
								{ subtitle &&
									<p className="mdc-dialog__lead">
										{ subtitle }
									</p>
								}
								{ hasProvides &&
									<section id={ describedByID } className="mdc-dialog__content">
										<ul className="mdc-list mdc-list--underlined mdc-list--non-interactive">
											{ provides.map( ( attribute ) => (
												<li className="mdc-list-item" key={ attribute }>
													<span className="mdc-list-item__text">{ attribute }</span>
												</li>
											) ) }
										</ul>
									</section>
								}
								{ dependentModules &&
									<p className="mdc-dialog__dependecies">
										<strong>{ __( 'Note: ', 'google-site-kit' ) }</strong>{ dependentModules }
									</p>
								}
								<footer className="mdc-dialog__actions">
									<Button
										onClick={ handleConfirm }
										danger
									>
										{ confirmButton ? confirmButton : __( 'Disconnect', 'google-site-kit' ) }
									</Button>
									<Link className="mdc-dialog__cancel-button" onClick={ () => handleDialog() } inherit>
										{ __( 'Cancel', 'google-site-kit' ) }
									</Link>
								</footer>
							</div>
						</div>
					</div>
				</FocusTrap>
			</div>
		);
	}
}

Dialog.propTypes = {
	dialogActive: PropTypes.bool,
	handleDialog: PropTypes.func,
	handleConfirm: PropTypes.func.isRequired,
	title: PropTypes.string,
	description: PropTypes.string,
	confirmButton: PropTypes.string,
};

Dialog.defaultProps = {
	dialogActive: false,
	handleDialog: null,
	title: null,
	description: null,
	confirmButton: null,
};

export default withInstanceId( Dialog );
