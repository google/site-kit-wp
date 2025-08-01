/**
 * AdSense notifications side-effect hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { MODULES_ADSENSE } from '../modules/adsense/datastore/constants';
import { MODULE_SLUG_ADSENSE } from '../modules/adsense/constants';
import { NOTIFICATION_AREAS } from '../googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '../googlesitekit/notifications/datastore/constants';
import NotificationFromServer from '../components/NotificationFromServer';

export default function useAdSenseNotifications() {
	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ADSENSE )
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);

	const [ registeredNotifications, setRegisteredNotifications ] = useState(
		[]
	);
	const { registerNotification } = useDispatch( CORE_NOTIFICATIONS );

	const notifications = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getNotifications()
	);

	useEffect( () => {
		// If AdSense is not connected, or the account ID is not set,
		// there's nothing to do here.
		if ( ! adSenseModuleConnected || ! accountID ) {
			return;
		}

		// Register any notifications from the server that haven't yet been
		// registered.
		//
		// (Usually there will be one, if any, notification from the server.)
		notifications?.forEach( ( notification ) => {
			if ( registeredNotifications.includes( notification.id ) ) {
				return;
			}

			/**
			 * Adjust the notification props to match the expected
			 * `NotificationFromServer` component props, which vary
			 * slightly from the attributes returned from the REST API.
			 */
			const notificationProps = { ...notification };

			// Some notifications do not include a `title` property, so supply
			// a default.
			if ( ! notificationProps.title ) {
				notificationProps.title = __(
					'Notice about your AdSense account',
					'google-site-kit'
				);
			}

			if (
				! notificationProps.content?.length &&
				!! notificationProps.description?.length
			) {
				notificationProps.content = notificationProps.description;
				delete notificationProps.description;
			}

			registerNotification( notification.id, {
				Component( { Notification } ) {
					return (
						<Notification>
							<NotificationFromServer { ...notificationProps } />
						</Notification>
					);
				},
				priority: notification.priority,
				areaSlug: NOTIFICATION_AREAS.HEADER,
				isDismissible: true, // AdSense alerts are always dismissible, but these will persist only for an hour in `<NotificationFromServer>`.
			} );

			setRegisteredNotifications( ( previousRegisteredNotifications ) => {
				return [ ...previousRegisteredNotifications, notification.id ];
			} );
		} );
	}, [
		accountID,
		adSenseModuleConnected,
		notifications,
		registerNotification,
		registeredNotifications,
	] );
}
