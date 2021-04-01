/**
 * Footer component for SettingsActiveModule.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '../../../material-components';
import PencilIcon from '../../../../svg/pencil.svg';
import TrashIcon from '../../../../svg/trash.svg';
import Button from '../../Button';
import Spinner from '../../Spinner';
import Link from '../../Link';
const { useSelect } = Data;

export default function Footer( props ) {
	const {
		slug,
		isSaving,
		isEditing,
		handleConfirm,
		handleCancel,
		handleEdit,
		handleDialog,
	} = props;

	const canSubmitChanges = useSelect( ( select ) => select( CORE_MODULES ).canSubmitChanges( slug ) );
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( slug ) );

	const setupComplete = module?.connected;
	const hasSettings = !! module?.SettingsEditComponent;

	const handleConfirmOrCancel = useCallback( () => {
		if ( hasSettings && setupComplete ) {
			handleConfirm();
		} else {
			handleCancel();
		}
	}, [ hasSettings, setupComplete ] );

	if ( ! module ) {
		return null;
	}

	const {
		name,
		homepage,
		forceActive: autoActivate,
	} = module;

	let primaryColumn = null;
	let secondaryColumn = null;

	if ( isEditing || isSaving ) {
		let buttonText = __( 'Close', 'google-site-kit' );
		if ( hasSettings && setupComplete ) {
			buttonText = isSaving
				? __( 'Saving…', 'google-site-kit' )
				: __( 'Confirm Changes', 'google-site-kit' );
		}

		primaryColumn = (
			<Fragment>
				<Button
					id={ hasSettings && setupComplete ? `confirm-changes-${ slug }` : `close-${ slug }` }
					disabled={ isSaving || ! canSubmitChanges }
					onClick={ handleConfirmOrCancel }
				>
					{ buttonText }
				</Button>

				<Spinner isSaving={ isSaving } />

				{ hasSettings && (
					<Link className="googlesitekit-settings-module__footer-cancel" onClick={ handleCancel } inherit>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Link>
				) }
			</Fragment>
		);
	} else if ( hasSettings || ! autoActivate ) {
		primaryColumn = (
			<Link
				className="googlesitekit-settings-module__edit-button"
				onClick={ handleEdit }
				inherit
			>
				{ __( 'Edit', 'google-site-kit' ) }
				<PencilIcon
					className="googlesitekit-settings-module__edit-button-icon"
					width="10"
					height="10"
				/>
			</Link>
		);
	}

	if ( isEditing && ! autoActivate ) {
		secondaryColumn = (
			<Link
				className="googlesitekit-settings-module__remove-button"
				onClick={ handleDialog }
				inherit
				danger
			>
				{
					/* translators: %s: module name */
					sprintf( __( 'Disconnect %s from Site Kit', 'google-site-kit' ), name )
				}
				<TrashIcon
					className="googlesitekit-settings-module__remove-button-icon"
					width="13"
					height="13"
				/>
			</Link>
		);
	} else if ( ! isEditing ) {
		secondaryColumn = (
			<Link
				href={ homepage }
				className="googlesitekit-settings-module__cta-button"
				inherit
				external
			>
				{
					/* translators: %s: module name */
					sprintf( __( 'See full details in %s', 'google-site-kit' ), name )
				}
			</Link>
		);
	}

	return (
		<footer className="googlesitekit-settings-module__footer">
			<Grid>
				<Row>
					<Cell lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
						{ primaryColumn }
					</Cell>
					<Cell className="mdc-layout-grid__cell--align-right-desktop" lgSize={ 6 } mdSize={ 8 } smSize={ 4 } alignMiddle>
						{ secondaryColumn }
					</Cell>
				</Row>
			</Grid>
		</footer>
	);
}

Footer.propTypes = {
	slug: PropTypes.string.isRequired,
	isSaving: PropTypes.bool.isRequired,
	isEditing: PropTypes.bool.isRequired,
	handleConfirm: PropTypes.func.isRequired,
	handleCancel: PropTypes.func.isRequired,
	handleEdit: PropTypes.func.isRequired,
	handleDialog: PropTypes.func.isRequired,
};
