/**
 * Notifications component.
 *
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
import Data from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { getNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

const { useSelect } = Data;

export default function Notifications() {
	const activeNotifications = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).getActiveNotifications()
	);

	if ( activeNotifications?.[ 0 ] === undefined ) {
		return null;
	}

	const { id, Component: ActiveNotification } = activeNotifications[ 0 ];
	const props = {
		id,
		...getNotificationComponentProps( id ),
	};

	return <ActiveNotification { ...props } />;
}
