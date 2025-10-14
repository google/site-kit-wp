/**
 * SetUpEmailReportingOverlayNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useCallback, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from './constants';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import OverlayNotification from '@/js/googlesitekit/notifications/components/layout/OverlayNotification';
import EmailReportingOverlayGraphic from '@/svg/graphics/email-reporting-overlay.svg';

export const SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION =
	'email-reporting-overlay-notification';

export default function SetUpEmailReportingOverlayNotification( {
	id,
	Notification,
} ) {
	const isSelectionPanelOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
	);
	const previousIsSelectionPanelOpen = usePrevious( isSelectionPanelOpen );

	const { setValue } = useDispatch( CORE_UI );
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const onSetupCallback = useCallback( () => {
		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ setValue ] );

	const tooltipSettings = {
		target: '.googlesitekit-user-selector',
		placement: 'bottom-end',
		className: 'googlesitekit-tour-tooltip--user-menu',
		tooltipSlug: 'email-reports-overlay-notification',
		title: __(
			'You can always manage your email reports subscription from the user menu',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};

	const showTooltip = useShowTooltip( tooltipSettings );

	const handleDismiss = useCallback( () => {
		showTooltip();
	}, [ showTooltip ] );

	const isUserSubscribed = useSelect( ( select ) =>
		select( CORE_USER ).isEmailReportingSubscribed()
	);

	useEffect( () => {
		if ( previousIsSelectionPanelOpen && ! isSelectionPanelOpen ) {
			dismissNotification( id );

			if ( ! isUserSubscribed ) {
				setTimeout( () => {
					showTooltip();
				}, 310 ); // Wait until after the panel close animation.
			}
		}
	}, [
		previousIsSelectionPanelOpen,
		isSelectionPanelOpen,
		dismissNotification,
		id,
		isUserSubscribed,
		showTooltip,
	] );

	return (
		<Notification>
			<OverlayNotification
				notificationID={ id }
				title={ __(
					'Get Site Insights in Your Inbox',
					'google-site-kit'
				) }
				description={ __(
					'Receive the most important insights about your site’s performance, key trends, and tailored metrics directly in your inbox',
					'google-site-kit'
				) }
				GraphicDesktop={ EmailReportingOverlayGraphic }
				GraphicMobile={ EmailReportingOverlayGraphic }
				ctaButton={ {
					label: __( 'Setup', 'google-site-kit' ),
					onClick: onSetupCallback,
					dismissOnClick: true,
				} }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: handleDismiss,
				} }
				newBadge
			/>
		</Notification>
	);
}

SetUpEmailReportingOverlayNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
