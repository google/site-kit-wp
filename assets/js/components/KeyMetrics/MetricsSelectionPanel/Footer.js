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
import { addQueryArgs } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import {
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	MIN_SELECTED_METRICS_COUNT,
	MAX_SELECTED_METRICS_COUNT,
} from '../constants';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { EDIT_SCOPE as ANALYTICS_EDIT_SCOPE } from '../../../modules/analytics/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../util/errors';
import Link from '../../Link';
import ErrorNotice from '../../ErrorNotice';
import { safelySort } from './utils';
import useViewContext from '../../../hooks/useViewContext';
import { trackEvent } from '../../../util';
const { useSelect, useDispatch } = Data;

export default function Footer( {
	savedMetrics,
	onNavigationToOAuthURL = () => {},
} ) {
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
		if ( ! requiredCustomDimensions?.length ) {
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

	const saveError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveKeyMetricsSettings', [
			{
				...keyMetricsSettings,
				widgetSlugs: selectedMetrics,
			},
		] )
	);

	// The `custom_dimensions` query value is arbitrary and serves two purposes:
	// 1. To ensure that `authentication_success` isn't appended when returning from OAuth.
	// 2. To guarantee it doesn't match any existing notifications in the `BannerNotifications` component, thus preventing any unintended displays.
	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'custom_dimensions',
	} );

	const isNavigatingToOAuthURL = useSelect( ( select ) => {
		const OAuthURL = select( CORE_USER ).getConnectURL( {
			additionalScopes: [ ANALYTICS_EDIT_SCOPE ],
			redirectURL,
		} );

		if ( ! OAuthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( OAuthURL );
	} );

	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
	);

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
			trackEvent( trackingCategory, 'metrics_sidebar_save' );

			if ( isGA4Connected && hasMissingCustomDimensions ) {
				setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
					autoSubmit: true,
				} );

				if ( ! hasAnalytics4EditScope ) {
					// Let parent component know that the user is navigating to OAuth URL
					// so that the panel is kept open.
					onNavigationToOAuthURL();

					// Ensure the state is set, just in case the user navigates to the
					// OAuth URL before the function is fully executed.
					setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );

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
							redirectURL,
						},
					} );
				}
			}

			// If the state has not been set to `false` yet, set it now.
			if ( isOpen ) {
				setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
			}

			// lock the button label while panel is closing
			setFinalButtonText( currentButtonText );
			setWasSaved( true );
		}
	}, [
		saveKeyMetricsSettings,
		selectedMetrics,
		trackingCategory,
		isGA4Connected,
		hasMissingCustomDimensions,
		isOpen,
		currentButtonText,
		setValues,
		hasAnalytics4EditScope,
		onNavigationToOAuthURL,
		setValue,
		setPermissionScopeError,
		redirectURL,
	] );

	const onCancelClick = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );
		trackEvent( trackingCategory, 'metrics_sidebar_cancel' );
	}, [ setValue, trackingCategory ] );

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

	const selectedMetricsCount = selectedMetrics?.length || 0;
	let metricsLimitError;
	if ( selectedMetricsCount < MIN_SELECTED_METRICS_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Minimum number of metrics that can be selected 2: Number of selected metrics */
			__(
				'Select at least %1$d metrics (%2$d selected)',
				'google-site-kit'
			),
			MIN_SELECTED_METRICS_COUNT,
			selectedMetricsCount
		);
	} else if ( selectedMetricsCount > MAX_SELECTED_METRICS_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Maximum number of metrics that can be selected 2: Number of selected metrics */
			__(
				'Select up to %1$d metrics (%2$d selected)',
				'google-site-kit'
			),

			MAX_SELECTED_METRICS_COUNT,
			selectedMetricsCount
		);
	}

	return (
		<footer className="googlesitekit-km-selection-panel-footer">
			{ saveError && <ErrorNotice error={ saveError } /> }
			<div className="googlesitekit-km-selection-panel-footer__content">
				{ haveSettingsChanged && metricsLimitError ? (
					<ErrorNotice
						error={ {
							message: metricsLimitError,
						} }
						noPrefix={
							selectedMetricsCount < MIN_SELECTED_METRICS_COUNT ||
							selectedMetricsCount > MAX_SELECTED_METRICS_COUNT
						}
					/>
				) : (
					<p className="googlesitekit-km-selection-panel-footer__metric-count">
						{ sprintf(
							/* translators: Number of selected metrics */
							__( '%d selected ', 'google-site-kit' ),
							selectedMetricsCount
						) }
						<span className="googlesitekit-km-selection-panel-footer__metric-count--max-count">
							{ sprintf(
								/* translators: Maximum number of metrics that can be selected */
								__( '(up to %d)', 'google-site-kit' ),
								MAX_SELECTED_METRICS_COUNT
							) }
						</span>
					</p>
				) }
				<div className="googlesitekit-km-selection-panel-footer__actions">
					<Link
						onClick={ onCancelClick }
						disabled={ isSavingSettings || isNavigatingToOAuthURL }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Link>
					<SpinnerButton
						onClick={ onSaveClick }
						isSaving={ isSavingSettings || isNavigatingToOAuthURL }
						disabled={
							selectedMetricsCount < MIN_SELECTED_METRICS_COUNT ||
							selectedMetricsCount > MAX_SELECTED_METRICS_COUNT ||
							isSavingSettings ||
							( ! isOpen && wasSaved ) ||
							isNavigatingToOAuthURL
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
	onNavigationToOAuthURL: PropTypes.func,
};
