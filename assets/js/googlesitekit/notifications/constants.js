/**
 * Notifications API constants.
 *
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

export const GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID =
	'warning-notification-gtg';

export const GTG_AUTO_ENABLE_NOTIFICATION = 'gtg-auto-enable-notification';
export const GTG_SETUP_CTA_BANNER_NOTIFICATION = 'gtg-setup-cta';

export const PRIORITY = {
	ERROR_HIGH: 30,
	ERROR_LOW: 60,
	WARNING: 100,
	INFO: 150,
	SETUP_CTA_HIGH: 150,
	SETUP_CTA_LOW: 200,
};

export const NOTIFICATION_AREAS = {
	HEADER: 'notification-area-header',
	DASHBOARD_TOP: 'notification-area-dashboard-top',
	OVERLAYS: 'notification-area-overlays',
};

export const NOTIFICATION_GROUPS = {
	DEFAULT: 'default',
	SETUP_CTAS: 'setup-ctas',
};
