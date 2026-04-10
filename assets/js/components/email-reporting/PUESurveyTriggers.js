/**
 * PUESurveyTriggers component.
 *
 * Fires Proactive User Engagement (PUE) survey triggers on dashboard load
 * based on the user's email reporting subscription status, whether the
 * user has clicked "Set up" on the overlay CTA, and whether the overlay
 * has ever been visible to the user for at least 3 seconds.
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
import {
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA,
} from './SetUpEmailReportingOverlayNotification';

export default function PUESurveyTriggers() {
	const settings = useSelect( ( select ) =>
		select( CORE_USER ).getEmailReportingSettings()
	);
	const isSubscribed = useSelect( ( select ) =>
		select( CORE_USER ).isEmailReportingSubscribed()
	);
	const hasClickedSetupCTA = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA
		)
	);
	const overlaySeenDates = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).getNotificationSeenDates(
			SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION
		)
	);

	// Wait for the server-backed inputs to resolve before firing any
	// trigger. `overlaySeenDates` is localStorage-backed and always
	// returns an array (empty or populated) from the datastore's
	// initialState, so it does not need a resolution guard.
	if ( settings === undefined || hasClickedSetupCTA === undefined ) {
		return null;
	}

	// Segment 1 — successfully activated.
	if ( isSubscribed ) {
		return (
			<SurveyViewTrigger triggerID="view_pue" ttl={ DAY_IN_SECONDS } />
		);
	}

	// Segment 3 — clicked "Set up" but did not subscribe. Checked
	// before segment 2 because clicking "Set up" implies the overlay
	// was already seen, so segment 3 users satisfy both conditions.
	if ( hasClickedSetupCTA ) {
		return (
			<SurveyViewTrigger
				triggerID="view_pue_not_subscribed"
				ttl={ DAY_IN_SECONDS }
			/>
		);
	}

	// Segment 2 — has seen the overlay (automatically marked seen
	// after 3s of viewport dwell via ViewedStateObserver) and has
	// not clicked "Set up".
	if ( overlaySeenDates.length > 0 ) {
		return (
			<SurveyViewTrigger
				triggerID="view_pue_setup_cta"
				ttl={ DAY_IN_SECONDS }
			/>
		);
	}

	return null;
}
