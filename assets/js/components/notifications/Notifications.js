/**
 * Notifications component.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
const { useSelect } = Data;

export default function Notifications( { viewContext, areaSlug } ) {
	const queuedNotifications = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).getQueuedNotifications( viewContext )
	);

	if (
		queuedNotifications?.[ 0 ] === undefined ||
		queuedNotifications?.[ 0 ]?.areaSlug !== areaSlug
	) {
		return null;
	}

	const { Component: ActiveNotification } = queuedNotifications[ 0 ];

	return <ActiveNotification />;
}
