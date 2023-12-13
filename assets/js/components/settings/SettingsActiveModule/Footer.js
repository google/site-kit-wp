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
import { useHistory, useParams } from 'react-router-dom';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { FORM_SETUP } from '../../../modules/analytics/datastore/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { Cell, Grid, Row } from '../../../material-components';
import PencilIcon from '../../../../svg/icons/pencil.svg';
import TrashIcon from '../../../../svg/icons/trash.svg';
import Link from '../../Link';
import { trackEvent } from '../../../util';
import { clearCache } from '../../../googlesitekit/api/cache';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import useViewContext from '../../../hooks/useViewContext';
const { useDispatch, useSelect } = Data;

export default function Footer( props ) {
	const { slug } = props;

	const viewContext = useViewContext();

	const history = useHistory();
	const { action, moduleSlug } = useParams();
	const isEditing = action === 'edit' && moduleSlug === slug;

	const errorKey = `module-${ slug }-error`;
	const dialogActiveKey = `module-${ slug }-dialogActive`;
	const isSavingKey = `module-${ slug }-isSaving`;

	const canSubmitChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).canSubmitChanges( slug )
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
	const enableGA4PropertyTooltip = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4PropertyTooltip' )
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const dismissGA4PropertyTooltip = useCallback( () => {
		if ( slug !== 'analytics' || ! enableGA4PropertyTooltip ) {
			return null;
		}
		setValues( FORM_SETUP, {
			enableGA4PropertyTooltip: false,
		} );
	}, [ slug, enableGA4PropertyTooltip, setValues ] );

	const moduleHomepage = useSelect( ( select ) => {
		if ( ! module || isEmpty( module.homepage ) ) {
			return undefined;
		}
		return select( CORE_USER ).getAccountChooserURL( module.homepage );
	} );

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

		if ( slug === 'analytics' ) {
			dismissGA4PropertyTooltip();
		}
	}, [ clearErrors, history, viewContext, slug, dismissGA4PropertyTooltip ] );

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
				await clearErrors?.();
				history.push( `/connected-services/${ slug }` );

				if ( slug === 'analytics' ) {
					dismissGA4PropertyTooltip();
				}
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
			dismissGA4PropertyTooltip,
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

	// Check if the resolution for the specified selector has finished.
	// This allows us to determine if the data needed by the module is still being loaded.
	// The primary reason for this loading check is to disable the submit button
	// while the necessary data for the settings is still being loaded, preventing
	// premature interactions by the user.
	const isLoading = useSelect( ( select ) => {
		const resolutionMapping = {
			analytics: 'getAccountSummaries',
			tagmanager: 'getAccounts',
			'search-console': 'getMatchedProperties',
		};
		const resolutionSelector = resolutionMapping[ slug ];

		if ( ! module || ! resolutionSelector ) {
			return false;
		}

		// Since the GA4 accounts are loaded from `account-summaries` of the `analytics-4` store
		// for the `getAccounts` selector, we need to use the `analytics-4` store name
		// instead of the module store name.
		const storeName =
			slug === 'analytics' ? MODULES_ANALYTICS_4 : module.storeName;

		return ! select( storeName ).hasFinishedResolution(
			resolutionSelector
		);
	} );

	let buttonText = __( 'Save', 'google-site-kit' );

	if ( canSubmitChanges ) {
		buttonText = __( 'Apply changes', 'google-site-kit' );
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
						disabled={ isSaving || isLoading }
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
					<Link
						className="googlesitekit-settings-module__footer-cancel"
						onClick={ handleClose }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Link>
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

	if ( isEditing && ! forceActive ) {
		secondaryColumn = (
			<Link
				className="googlesitekit-settings-module__remove-button"
				onClick={ handleDialog }
				danger
			>
				{ sprintf(
					/* translators: %s: module name */
					__( 'Disconnect %s from Site Kit', 'google-site-kit' ),
					name
				) }
				<TrashIcon
					className="googlesitekit-settings-module__remove-button-icon"
					width="13"
					height="13"
				/>
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
