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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	MIN_SELECTED_METRICS_COUNT,
	MAX_SELECTED_METRICS_COUNT,
} from '../constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../util/errors';
import useViewContext from '../../../hooks/useViewContext';
import { trackEvent } from '../../../util';
import { SelectionPanelFooter } from '../../SelectionPanel';
import { useFeature } from '../../../hooks/useFeature';

export default function Footer( {
	isOpen,
	closePanel,
	savedMetrics,
	onNavigationToOAuthURL = () => {},
} ) {
	const viewContext = useViewContext();
	const isConversionReportingEnabled = useFeature( 'conversionReporting' );

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
		select( CORE_USER ).hasScope( EDIT_SCOPE )
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
			additionalScopes: [ EDIT_SCOPE ],
			redirectURL,
		} );

		if ( ! OAuthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( OAuthURL );
	} );

	const { saveKeyMetricsSettings, setPermissionScopeError } =
		useDispatch( CORE_USER );
	const { setValues } = useDispatch( CORE_FORMS );

	const saveSettings = useCallback(
		async ( widgetSlugs ) => {
			// We could simply return the value of `saveKeyMetricsSettings()` here,
			// but this makes the expected return value more explicit.
			const { error } = await saveKeyMetricsSettings( {
				widgetSlugs,
			} );

			return { error };
		},
		[ saveKeyMetricsSettings ]
	);

	const onSaveSuccess = useCallback( () => {
		trackEvent( trackingCategory, 'metrics_sidebar_save' );

		if ( isGA4Connected && hasMissingCustomDimensions ) {
			setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: true,
			} );

			if ( ! hasAnalytics4EditScope ) {
				// Let parent component know that the user is navigating to OAuth URL
				// so that the panel is kept open.
				onNavigationToOAuthURL();

				// Ensure the panel is closed, just in case the user navigates to
				// the OAuth URL before the function is fully executed.
				closePanel();

				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __(
						'Additional permissions are required to create new Analytics custom dimensions',
						'google-site-kit'
					),
					data: {
						status: 403,
						scopes: [ EDIT_SCOPE ],
						skipModal: true,
						redirectURL,
					},
				} );
			}
		}
	}, [
		trackingCategory,
		isGA4Connected,
		hasMissingCustomDimensions,
		setValues,
		hasAnalytics4EditScope,
		onNavigationToOAuthURL,
		closePanel,
		setPermissionScopeError,
		redirectURL,
	] );

	const onCancel = useCallback( () => {
		trackEvent( trackingCategory, 'metrics_sidebar_cancel' );
	}, [ trackingCategory ] );

	const selectedMetricsCount = selectedMetrics?.length || 0;
	const maxSelectedMetricsLimit = isConversionReportingEnabled
		? 8
		: MAX_SELECTED_METRICS_COUNT;
	let metricsLimitError;
	if ( selectedMetricsCount < MIN_SELECTED_METRICS_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Minimum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select at least %1$d metrics (%2$d selected)',
				'google-site-kit'
			),
			MIN_SELECTED_METRICS_COUNT,
			selectedMetricsCount
		);
	} else if ( selectedMetricsCount > maxSelectedMetricsLimit ) {
		metricsLimitError = sprintf(
			/* translators: 1: Maximum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select up to %1$d metrics (%2$d selected)',
				'google-site-kit'
			),

			maxSelectedMetricsLimit,
			selectedMetricsCount
		);
	}

	return (
		<SelectionPanelFooter
			savedItemSlugs={ savedMetrics }
			selectedItemSlugs={ selectedMetrics }
			saveSettings={ saveSettings }
			saveError={ saveError }
			itemLimitError={ metricsLimitError }
			minSelectedItemCount={ MIN_SELECTED_METRICS_COUNT }
			maxSelectedItemCount={ maxSelectedMetricsLimit }
			isBusy={ isSavingSettings || isNavigatingToOAuthURL }
			onSaveSuccess={ onSaveSuccess }
			onCancel={ onCancel }
			isOpen={ isOpen }
			closePanel={ closePanel }
		/>
	);
}

Footer.propTypes = {
	isOpen: PropTypes.bool,
	closePanel: PropTypes.func.isRequired,
	savedMetrics: PropTypes.array,
	onNavigationToOAuthURL: PropTypes.func,
};
