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

import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_SPLASH,
} from '../../constants';

export const CORE_NOTIFICATIONS = 'core/notifications';

export const NOTIFICATION_AREAS = {
	ERRORS: 'notification-area-errors',
	BANNERS_ABOVE_NAV: 'notification-area-banners-above-nav',
	BANNERS_BELOW_NAV: 'notification-area-banners-below-nav',
};

export const NOTIFICATION_GROUPS = {
	DEFAULT: 'default',
	SETUP_CTAS: 'setup-ctas',
};

export const NOTIFICATION_VIEW_CONTEXTS = [
	VIEW_CONTEXT_SPLASH,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
];

export const FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID =
	'fpm-warning-notification';
