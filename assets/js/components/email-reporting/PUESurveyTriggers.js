/**
 * PUESurveyTriggers component.
 *
 * Fires Proactive User Engagement (PUE) survey triggers on dashboard load
 * based on the user's email reporting subscription status and whether the
 * user has previously seen the email reporting setup CTA overlay.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import SurveyViewTrigger from '@/js/components/surveys/SurveyViewTrigger';
import { SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION } from './SetUpEmailReportingOverlayNotification';

export default function PUESurveyTriggers() {
	const settings = useSelect( ( select ) =>
		select( CORE_USER ).getEmailReportingSettings()
	);
	const isSubscribed = useSelect( ( select ) =>
		select( CORE_USER ).isEmailReportingSubscribed()
	);
	const hasSeenSetupCTA = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissed(
			SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION
		)
	);

	// Wait until both the user's email reporting settings and the
	// notification dismissed state have resolved before dispatching any
	// trigger. This prevents firing `view_pue_not_subscribed` for a user
	// who is actually subscribed (but whose settings have not yet loaded).
	if ( settings === undefined || hasSeenSetupCTA === undefined ) {
		return null;
	}

	if ( isSubscribed ) {
		return (
			<SurveyViewTrigger triggerID="view_pue" ttl={ DAY_IN_SECONDS } />
		);
	}

	if ( hasSeenSetupCTA ) {
		return (
			<SurveyViewTrigger
				triggerID="view_pue_not_subscribed"
				ttl={ DAY_IN_SECONDS }
			/>
		);
	}

	return null;
}
