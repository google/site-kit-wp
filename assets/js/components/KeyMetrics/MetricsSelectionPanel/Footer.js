/**
 * Key Metrics Selection Panel Footer
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
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import {
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
} from '../constants';
import Link from '../../Link';
import ErrorNotice from '../../ErrorNotice';
import { safelySort } from './utils';
import useViewContext from '../../../hooks/useViewContext';
import { trackEvent } from '../../../util';
import { useFeature } from '../../../hooks/useFeature';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { EDIT_SCOPE as ANALYTICS_EDIT_SCOPE } from '../../../modules/analytics/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../util/errors';
const { useSelect, useDispatch } = Data;

export default function Footer( { savedMetrics } ) {
	const keyMetricsEnabled = useFeature( 'keyMetrics' );
	const viewContext = useViewContext();
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);
	const keyMetricsSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingKeyMetricsSettings()
	);
	const trackingCategory = `${ viewContext }_kmw-sidebar`;

	const haveSettingsChanged = useMemo( () => {
		// Arrays need to be sorted to match in `isEqual`.
		return ! isEqual(
			safelySort( selectedMetrics ),
			safelySort( savedMetrics )
		);
	}, [ savedMetrics, selectedMetrics ] );

	const requiredCustomDimensions = selectedMetrics?.flatMap( ( tileName ) => {
		const tile = KEY_METRICS_WIDGETS[ tileName ];
		return tile?.requiredCustomDimensions || [];
	} );

	const hasMissingCustomDimensions = useSelect( ( select ) => {
		if ( ! keyMetricsEnabled || ! requiredCustomDimensions?.length ) {
			return false;
		}

		const hasCustomDimensions = select(
			MODULES_ANALYTICS_4
		).hasCustomDimensions( requiredCustomDimensions );

		return ! hasCustomDimensions;
	} );

	const hasAnalytics4EditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( ANALYTICS_EDIT_SCOPE )
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const saveError = useSelect( ( select ) => {
		if ( haveSettingsChanged && selectedMetrics?.length < 2 ) {
			return {
				message: __( 'Select at least 2 metrics', 'google-site-kit' ),
			};
		}

		return select( CORE_USER ).getErrorForAction(
			'saveKeyMetricsSettings',
			[
				{
					...keyMetricsSettings,
					widgetSlugs: selectedMetrics,
				},
			]
		);
	} );

	const { saveKeyMetricsSettings, setPermissionScopeError } =
		useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );
	const { setValues } = useDispatch( CORE_FORMS );

	const [ finalButtonText, setFinalButtonText ] = useState( null );
	const [ wasSaved, setWasSaved ] = useState( false );

	const currentButtonText =
		savedMetrics?.length > 0 && haveSettingsChanged
			? __( 'Apply changes', 'google-site-kit' )
			: __( 'Save selection', 'google-site-kit' );

	const onSaveClick = useCallback( async () => {
		const { error } = await saveKeyMetricsSettings( {
			widgetSlugs: selectedMetrics,
		} );

		if ( ! error ) {
			setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
			trackEvent( trackingCategory, 'metrics_sidebar_save' );
			if ( keyMetricsEnabled && isGA4Connected ) {
				if ( hasMissingCustomDimensions ) {
					setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
						autoSubmit: true,
					} );

					if ( ! hasAnalytics4EditScope ) {
						setPermissionScopeError( {
							code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
							message: __(
								'Additional permissions are required to create new Analytics custom dimensions.',
								'google-site-kit'
							),
							data: {
								status: 403,
								scopes: [ ANALYTICS_EDIT_SCOPE ],
								skipModal: true,
							},
						} );
					}
				}
			}

			// lock the button label while panel is closing
			setFinalButtonText( currentButtonText );
			setWasSaved( true );
		}
	}, [
		saveKeyMetricsSettings,
		selectedMetrics,
		setValue,
		trackingCategory,
		keyMetricsEnabled,
		isGA4Connected,
		currentButtonText,
		hasMissingCustomDimensions,
		setValues,
		hasAnalytics4EditScope,
		setPermissionScopeError,
	] );

	const onCancelClick = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
		trackEvent( trackingCategory, 'metrics_sidebar_cancel' );
	}, [ setValue, trackingCategory ] );

	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
	);

	const [ prevIsOpen, setPrevIsOpen ] = useState( null );

	useEffect( () => {
		if ( prevIsOpen !== null ) {
			// if current isOpen is true, and different from prevIsOpen
			// meaning it transitioned from false to true and it is not
			// in closing transition, we should reset the button label
			// locked when save button was clicked
			if ( prevIsOpen !== isOpen ) {
				if ( isOpen ) {
					setFinalButtonText( null );
					setWasSaved( false );
				}
			}
		}

		setPrevIsOpen( isOpen );
	}, [ isOpen, prevIsOpen ] );

	return (
		<footer className="googlesitekit-km-selection-panel-footer">
			{ saveError && (
				<ErrorNotice
					error={ saveError }
					noPrefix={ selectedMetrics?.length < 2 }
				/>
			) }
			<div className="googlesitekit-km-selection-panel-footer__content">
				<p className="googlesitekit-km-selection-panel-footer__metric-count">
					{ sprintf(
						/* translators: 1: Number of selected metrics, 2: Number of selectable metrics */
						__( '%1$d of %2$d selected', 'google-site-kit' ),
						selectedMetrics?.length || 0,
						4
					) }
				</p>
				<div className="googlesitekit-km-selection-panel-footer__actions">
					<Link
						onClick={ onCancelClick }
						disabled={ isSavingSettings }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Link>
					<SpinnerButton
						onClick={ onSaveClick }
						isSaving={ isSavingSettings }
						disabled={
							selectedMetrics?.length < 2 ||
							selectedMetrics?.length > 4 ||
							isSavingSettings ||
							( ! isOpen && wasSaved )
						}
					>
						{ finalButtonText || currentButtonText }
					</SpinnerButton>
				</div>
			</div>
		</footer>
	);
}

Footer.propTypes = {
	savedMetrics: PropTypes.array,
};
