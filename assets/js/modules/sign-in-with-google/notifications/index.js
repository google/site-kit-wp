/**
 * Sign in with Google module notification registrations.
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
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SETTINGS,
} from '@/js/googlesitekit/constants';
import {
	requireHomeURLUsingHTTPS,
	requireModuleConnected,
	requireQueryArg,
} from '@/js/googlesitekit/data-requirements';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { createRegisterNotifications } from '@/js/googlesitekit/notifications/util/create-register-notifications';
import CompatibilityWarningSubtleNotification from '@/js/modules/sign-in-with-google/components/dashboard/CompatibilityWarningSubtleNotification';
import SetupSuccessSubtleNotification from '@/js/modules/sign-in-with-google/components/dashboard/SetupSuccessSubtleNotification';
import SignInWithGoogleSetupCTABanner from '@/js/modules/sign-in-with-google/components/dashboard/SignInWithGoogleSetupCTABanner';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import { requireCompatibilityCheckErrors } from '@/js/modules/sign-in-with-google/data-requirements';
import { asyncRequire, asyncRequireAll } from '@/js/util/async';

export const SIGN_IN_WITH_GOOGLE_NOTIFICATIONS = {
	'sign-in-with-google-setup-cta': {
		Component: SignInWithGoogleSetupCTABanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			asyncRequire(
				false,
				requireModuleConnected( MODULE_SLUG_SIGN_IN_WITH_GOOGLE )
			),
			requireHomeURLUsingHTTPS()
		),
		isDismissible: true,
	},
	'setup-success-notification-siwg': {
		Component: SetupSuccessSubtleNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireQueryArg( 'notification', 'authentication_success' ),
			requireQueryArg( 'slug', MODULE_SLUG_SIGN_IN_WITH_GOOGLE )
		),
	},
	'sign-in-with-google-compatibility-warning': {
		Component: CompatibilityWarningSubtleNotification,
		priority: PRIORITY.WARNING,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_SETTINGS,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
		],
		checkRequirements: asyncRequireAll(
			// The connection check comes first so that the compatibility
			// checks request is only issued once the module is connected.
			requireModuleConnected( MODULE_SLUG_SIGN_IN_WITH_GOOGLE ),
			requireCompatibilityCheckErrors()
		),
		isDismissible: true,
	},
};

export function registerNotifications( notifications ) {
	createRegisterNotifications(
		notifications,
		SIGN_IN_WITH_GOOGLE_NOTIFICATIONS
	);
}
