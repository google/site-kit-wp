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
 * External dependencies
 */
import PropTypes from 'prop-types';
import { usePrevious } from 'react-use';
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import useViewContext from '../../hooks/useViewContext';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/datastore/constants';
import { getNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { safelySort } from '../../util';

export default function Notifications( {
	areaSlug,
	groupID = NOTIFICATION_GROUPS.DEFAULT,
} ) {
	const viewContext = useViewContext();
	const queuedNotifications = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).getQueuedNotifications(
			viewContext,
			groupID
		)
	);

	const onDemandNotifications = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).getOnDemandNotifications(
			viewContext,
			groupID
		)
	);
	const previousOnDemandNotifications = usePrevious( onDemandNotifications );

	const { queueNotification } = useDispatch( CORE_NOTIFICATIONS );

	useEffect( () => {
		if (
			// Only run this block when the set of on-demand notifications actually changes.
			// If new notifications appear, we queue them (unless they're already queued).
			! isEqual(
				safelySort( previousOnDemandNotifications ),
				safelySort( onDemandNotifications )
			)
		) {
			for ( const notification of onDemandNotifications ) {
				const alreadyQueued = queuedNotifications.find(
					( queuedNotification ) =>
						queuedNotification.id === notification.id
				);

				if ( ! alreadyQueued ) {
					queueNotification( notification );
				}
			}
		}
	}, [
		onDemandNotifications,
		previousOnDemandNotifications,
		queuedNotifications,
		queueNotification,
	] );

	if (
		queuedNotifications?.[ 0 ] === undefined ||
		queuedNotifications?.[ 0 ]?.areaSlug !== areaSlug
	) {
		return null;
	}

	const { id, Component: ActiveNotification } = queuedNotifications[ 0 ];
	const props = { ...getNotificationComponentProps( id ) };

	return <ActiveNotification { ...props } />;
}

Notifications.propTypes = {
	viewContext: PropTypes.string,
	areaSlug: PropTypes.string,
};
