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

/* eslint complexity: [ "error", 20 ] */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { useHistory, useParams } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '../../../material-components';
import PencilIcon from '../../../../svg/icons/pencil.svg';
import TrashIcon from '../../../../svg/icons/trash.svg';
import Link from '../../Link';
import { trackEvent } from '../../../util';
import { clearCache } from '../../../googlesitekit/api/cache';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import useViewContext from '../../../hooks/useViewContext';

export default function Footer( props ) {
	const { slug } = props;

	const viewContext = useViewContext();

	const history = useHistory();
	const { action, moduleSlug } = useParams();
	const isEditing = action === 'edit' && moduleSlug === slug;

	const errorKey = `module-${ slug }-error`;
	const dialogActiveKey = `module-${ slug }-dialogActive`;
	const isSavingKey = `module-${ slug }-isSaving`;

	const areSettingsEditDependenciesLoaded = useSelect( ( select ) =>
		select( CORE_MODULES ).areSettingsEditDependenciesLoaded( slug )
	);
	const canSubmitChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).canSubmitChanges( slug )
	);
	const haveSettingsChanged = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSettingsChanged( slug )
	);
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( slug )
	);
	const moduleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( slug )
	);
	const dialogActive = useSelect( ( select ) =>
		select( CORE_UI ).getValue( dialogActiveKey )
	);
	const isSaving = useSelect( ( select ) =>
		select( CORE_UI ).getValue( isSavingKey )
	);

	const moduleHomepage = useSelect( ( select ) =>
		select( CORE_MODULES ).getDetailsLinkURL( slug )
	);

	const { submitChanges } = useDispatch( CORE_MODULES );
	const { clearErrors } = useDispatch( module?.storeName ) || {};
	const { setValue } = useDispatch( CORE_UI );

	const hasSettings = !! module?.SettingsEditComponent;

	const handleClose = useCallback( async () => {
		await trackEvent(
			`${ viewContext }_module-list`,
			'cancel_module_settings',
			slug
		);
		await clearErrors?.();
		history.push( `/connected-services/${ slug }` );
	}, [ clearErrors, history, viewContext, slug ] );

	const handleConfirm = useCallback(
		async ( event ) => {
			event.preventDefault();

			setValue( isSavingKey, true );
			const { error: submissionError } = await submitChanges( slug );
			setValue( isSavingKey, false );

			if ( submissionError ) {
				setValue( errorKey, submissionError );
			} else {
				await trackEvent(
					`${ viewContext }_module-list`,
					'update_module_settings',
					slug
				);
				setValue( errorKey, undefined );
				await clearErrors?.();
				history.push( `/connected-services/${ slug }` );

				await clearCache();
			}
		},
		[
			setValue,
			isSavingKey,
			submitChanges,
			slug,
			errorKey,
			clearErrors,
			history,
			viewContext,
		]
	);

	const handleDialog = useCallback( () => {
		setValue( dialogActiveKey, ! dialogActive );
	}, [ dialogActive, dialogActiveKey, setValue ] );

	const handleEdit = useCallback( () => {
		trackEvent(
			`${ viewContext }_module-list`,
			'edit_module_settings',
			slug
		);
	}, [ slug, viewContext ] );

	let buttonText = __( 'Save', 'google-site-kit' );

	if ( haveSettingsChanged ) {
		buttonText = __( 'Confirm changes', 'google-site-kit' );
	}
	if ( isSaving ) {
		buttonText = __( 'Saving…', 'google-site-kit' );
	}

	if ( ! module ) {
		return null;
	}

	const { name, forceActive } = module;
	let primaryColumn = null;
	let secondaryColumn = null;

	if ( isEditing || isSaving ) {
		primaryColumn = (
			<Fragment>
				{ hasSettings && moduleConnected ? (
					<SpinnerButton
						disabled={
							isSaving ||
							! areSettingsEditDependenciesLoaded ||
							( ! canSubmitChanges && // Do not allow the form to be saved if the form is invalid.
								haveSettingsChanged ) // Allow the form to be saved if the user hasn't made any changes.
						}
						onClick={ handleConfirm }
						isSaving={ isSaving }
					>
						{ buttonText }
					</SpinnerButton>
				) : (
					<Button onClick={ handleClose }>
						{ __( 'Close', 'google-site-kit' ) }
					</Button>
				) }

				{ hasSettings && (
					<Button
						tertiary
						className="googlesitekit-settings-module__footer-cancel"
						onClick={ handleClose }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Button>
				) }
			</Fragment>
		);
	} else if ( hasSettings || ! forceActive ) {
		primaryColumn = (
			<Link
				className="googlesitekit-settings-module__edit-button"
				to={ `/connected-services/${ slug }/edit` }
				onClick={ handleEdit }
				aria-label={ sprintf(
					/* translators: %s: module name */
					__( 'Edit %s settings', 'google-site-kit' ),
					name
				) }
				trailingIcon={
					<PencilIcon
						className="googlesitekit-settings-module__edit-button-icon"
						width={ 10 }
						height={ 10 }
					/>
				}
			>
				{ __( 'Edit', 'google-site-kit' ) }
			</Link>
		);
	}

	if ( isEditing && ! forceActive ) {
		secondaryColumn = (
			<Link
				className="googlesitekit-settings-module__remove-button"
				onClick={ handleDialog }
				danger
				trailingIcon={
					<TrashIcon
						className="googlesitekit-settings-module__remove-button-icon"
						width={ 13 }
						height={ 13 }
					/>
				}
			>
				{ sprintf(
					/* translators: %s: module name */
					__( 'Disconnect %s from Site Kit', 'google-site-kit' ),
					name
				) }
			</Link>
		);
	} else if ( ! isEditing && moduleHomepage ) {
		secondaryColumn = (
			<Link
				href={ moduleHomepage }
				className="googlesitekit-settings-module__cta-button"
				external
			>
				{ sprintf(
					/* translators: %s: module name */
					__( 'See full details in %s', 'google-site-kit' ),
					name
				) }
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
					<Cell
						lgSize={ 6 }
						mdSize={ 8 }
						smSize={ 4 }
						alignMiddle
						lgAlignRight
					>
						{ secondaryColumn }
					</Cell>
				</Row>
			</Grid>
		</footer>
	);
}

Footer.propTypes = {
	slug: PropTypes.string.isRequired,
};
