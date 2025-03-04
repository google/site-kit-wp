/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	NOTIFICATION_VIEW_CONTEXTS,
} from './datastore/constants';

export { registerStore } from './datastore';
export { registerDefaults as registerNotifications } from './register-defaults';

export {
	ActionsCTALinkDismiss,
	BannerIcon,
	CTALink,
	CTALinkSubtle,
	LearnMoreLink,
	Description,
	Dismiss,
	Title,
} from './components/common';

export {
	NotificationError,
	NotificationWithSmallSVG,
	NotificationWithSVG,
	SimpleNotification,
	SingleColumnNotificationWithSVG,
	SubtleNotification,
} from './components/layout';

export {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	NOTIFICATION_VIEW_CONTEXTS,
};

export function createNotifications( registry ) {
	const { dispatch } = registry;

	const Notifications = {
		registerNotification( id, settings ) {
			dispatch( CORE_NOTIFICATIONS ).registerNotification( id, settings );
		},
	};

	return Notifications;
}
