/**
 * Notifications API defaults
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

import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../constants';
import { NOTIFICATION_AREAS } from './datastore/constants';

/**
 * Registers notifications not specific to any one particular module.
 *
 * @since n.e.x.t
 *
 * @param {Object} notificationsAPI Notifications API.
 */
export function registerDefaults( notificationsAPI ) {
	// TODO: This file and the below code is pure scaffolding and for test QA purposes.
	// It will be modified in issue #8976 that registers the first refactored notification.
	notificationsAPI.registerNotification( 'gathering-data-notification', {
		Component() {
			return <h1>TODO: Use a valid notification component here.</h1>;
		},
		priority: 100,
		areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: () => false,
		isDismissible: true,
	} );
}
