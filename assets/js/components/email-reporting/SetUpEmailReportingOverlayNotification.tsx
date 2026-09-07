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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { FEATURES_MENU_BUTTON_CLASS } from '@/js/components/FeaturesMenu/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import OverlayNotification from '@/js/googlesitekit/notifications/components/layout/OverlayNotification';
import EmailReportingOverlayGraphicDesktop from '@/svg/graphics/email-reporting-overlay-desktop.svg';
import EmailReportingOverlayGraphicMobile from '@/svg/graphics/email-reporting-overlay-mobile.svg';
import {
	MANAGE_EMAIL_REPORTS_BUTTON_CLASS,
	USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
} from './constants';

export const SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION =
	'email_reports_setup_overlay_notification';

// Dismissed-item slug used as a persistent "user clicked the Try it
// button on the overlay CTA" flag. Distinct from the notification's
// own dismissed-item slug (set by both "Try it" via dismissOnClick
// and "Got it" via the dismissButton), this slug is set ONLY when the
// user clicks "Try it", and is read by PUESurveyTriggers to
// distinguish users who engaged with the setup flow from users who
// dismissed the overlay without ever clicking "Try it".
export const SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA = `${ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION }_setup_cta`;

interface SetUpEmailReportingOverlayNotificationProps {
	id: string;
	Notification: ElementType;
}

const SetUpEmailReportingOverlayNotification: FC<
	SetUpEmailReportingOverlayNotificationProps
> = ( { id, Notification } ) => {
	const { setValue } = useDispatch( CORE_UI );
	const { dismissItem } = useDispatch( CORE_USER );

	const onSetupCallback = useCallback( () => {
		dismissItem( SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA, {
			expiresInSeconds: 0,
		} );
		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ dismissItem, setValue ] );

	return (
		<Notification>
			<OverlayNotification
				notificationID={ id }
				className="googlesitekit-email-reporting-introduction-overlay"
				// On mobile and tablet the email reports button collapses into
				// the features menu, so the overlay anchors to whichever
				// trigger exists.
				anchorID={ `.${ MANAGE_EMAIL_REPORTS_BUTTON_CLASS }, .${ FEATURES_MENU_BUTTON_CLASS }` }
				title={ __(
					'Get site insights in your inbox',
					'google-site-kit'
				) }
				description={ __(
					'Receive the most important insights about your site’s performance, key trends, and tailored metrics directly in your inbox',
					'google-site-kit'
				) }
				GraphicDesktop={ EmailReportingOverlayGraphicDesktop }
				GraphicMobile={ EmailReportingOverlayGraphicMobile }
				ctaButton={ {
					label: __( 'Try it', 'google-site-kit' ),
					onClick: onSetupCallback,
					dismissOnClick: true,
				} }
				dismissButton={ {
					label: __( 'Got it', 'google-site-kit' ),
				} }
				newBadge
			/>
		</Notification>
	);
};

export default SetUpEmailReportingOverlayNotification;
