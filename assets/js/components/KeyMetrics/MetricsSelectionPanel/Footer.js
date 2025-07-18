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
import { noop } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	useSelect,
	useDispatch,
	useInViewSelect,
	useRegistry,
} from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../util/errors';
import useViewContext from '../../../hooks/useViewContext';
import { snapshotAllStores } from '../../../googlesitekit/data/create-snapshot-store';
import { trackEvent } from '../../../util';
import SelectionPanelFooter from './SelectionPanelFooter';

export default function Footer( {
	isOpen,
	closePanel = noop,
	savedMetrics,
	onNavigationToOAuthURL = () => {},
	isFullScreen = false,
} ) {
	const registry = useRegistry();
	const viewContext = useViewContext();

	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingKeyMetricsSettings()
	);
	const trackingCategory = `${ viewContext }_kmw-sidebar`;

	const requiredCustomDimensions = selectedMetrics?.flatMap( ( tileName ) => {
		const tile = KEY_METRICS_WIDGETS[ tileName ];
		return tile?.requiredCustomDimensions || [];
	} );

	const hasMissingCustomDimensions = useInViewSelect(
		( select ) => {
			if ( ! requiredCustomDimensions?.length ) {
				return false;
			}

			const hasCustomDimensions = select(
				MODULES_ANALYTICS_4
			).hasCustomDimensions( requiredCustomDimensions );

			return ! hasCustomDimensions;
		},
		[ requiredCustomDimensions ]
	);

	const hasAnalytics4EditScope = useInViewSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	// The `custom_dimensions` query value is arbitrary and serves two purposes:
	// 1. To ensure that `authentication_success` isn't appended when returning from OAuth.
	// 2. To guarantee it doesn't match any existing notifications in the `BannerNotifications` component, thus preventing any unintended displays.
	const redirectURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
			notification: 'custom_dimensions',
		} )
	);

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

	const mainDashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const isNavigatingToMainDashboard = useSelect( ( select ) => {
		return (
			!! mainDashboardURL &&
			select( CORE_LOCATION ).isNavigatingTo( mainDashboardURL )
		);
	} );

	const { saveKeyMetricsSettings, setPermissionScopeError } =
		useDispatch( CORE_USER );
	const { setValues } = useDispatch( CORE_FORMS );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const conversionReportingSpecificKeyMetricsWidgets = useSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getKeyMetricsConversionEventWidgets()
	);

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

	const onSaveSuccess = useCallback(
		async ( selectedItemSlugs ) => {
			const userSavedConversionReportingKeyMetricsList = Object.values(
				conversionReportingSpecificKeyMetricsWidgets
			)
				.flat()
				.some( ( slug ) => selectedItemSlugs.includes( slug ) );

			// Include the conversion_reporting tracking label if necessary.
			if ( userSavedConversionReportingKeyMetricsList ) {
				trackEvent(
					trackingCategory,
					'metrics_sidebar_save',
					'conversion_reporting'
				);
			} else {
				trackEvent( trackingCategory, 'metrics_sidebar_save' );
			}

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

					return;
				}

				// Snapshot `CORE_FORMS` store to ensure the form data is retained
				// across page navigations.
				if ( isFullScreen ) {
					await snapshotAllStores( registry );
				}
			}

			// In the full screen app, navigate to the dashboard after saving.
			if ( isFullScreen ) {
				navigateTo( mainDashboardURL );
			}
		},
		[
			conversionReportingSpecificKeyMetricsWidgets,
			isGA4Connected,
			hasMissingCustomDimensions,
			isFullScreen,
			trackingCategory,
			setValues,
			hasAnalytics4EditScope,
			onNavigationToOAuthURL,
			closePanel,
			setPermissionScopeError,
			redirectURL,
			registry,
			navigateTo,
			mainDashboardURL,
		]
	);

	const onCancel = useCallback( () => {
		trackEvent( trackingCategory, 'metrics_sidebar_cancel' );

		// In the full screen app, navigate to the dashboard after canceling.
		if ( isFullScreen ) {
			navigateTo( mainDashboardURL );
		}
	}, [ isFullScreen, mainDashboardURL, navigateTo, trackingCategory ] );

	return (
		<SelectionPanelFooter
			savedItemSlugs={ savedMetrics }
			selectedItemSlugs={ selectedMetrics }
			saveSettings={ saveSettings }
			minSelectedItemCount={ MIN_SELECTED_METRICS_COUNT }
			maxSelectedItemCount={ MAX_SELECTED_METRICS_COUNT }
			isBusy={
				isSavingSettings ||
				isNavigatingToOAuthURL ||
				( isNavigatingToMainDashboard && isFullScreen )
			}
			onSaveSuccess={ () => {
				onSaveSuccess( selectedMetrics );
			} }
			onCancel={ onCancel }
			isOpen={ isOpen }
			closePanel={ closePanel }
			isFullScreen={ isFullScreen }
		/>
	);
}

Footer.propTypes = {
	isOpen: PropTypes.bool,
	closePanel: PropTypes.func,
	savedMetrics: PropTypes.array,
	onNavigationToOAuthURL: PropTypes.func,
	isFullScreen: PropTypes.bool,
};
