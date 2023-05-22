/**
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
 * Internal dependencies
 */
import { CORE_NOTIFICATIONS } from './datastore/constants';

export { registerStore } from './datastore';
export { registerNotifications } from './register-notifications';

export function createNotifications( registry ) {
	const { dispatch, select } = registry;

	const Notifications = {
		registerNotification( id, settings ) {
			dispatch( CORE_NOTIFICATIONS ).registerNotification( id, settings );
		},

		getNotifications() {
			select( CORE_NOTIFICATIONS ).getNotifications();
		},
	};

	return Notifications;
}
