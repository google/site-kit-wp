/**
 * FeatureDiscoverySetupSuccessNotification component.
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
 * External dependencies
 */
import { ElementType, FC } from 'react';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { FEATURE_SETUP_SUCCESS_NOTIFICATION_EVENT_ID } from '@/js/components/feature-discovery/constants';
import FeatureSuccessNotice from '@/js/components/feature-discovery/FeatureSuccessNotice';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useViewContext from '@/js/hooks/useViewContext';

interface FeatureDiscoverySetupSuccessNotificationProps {
	id: string;
	Notification: ElementType;
}

const FeatureDiscoverySetupSuccessNotification: FC<
	FeatureDiscoverySetupSuccessNotificationProps
> = ( { id, Notification } ) => {
	const viewContext = useViewContext();

	const slug = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).getPendingSetup()?.featureSlug,
		[]
	);

	const { receivePendingSetup } = useDispatch( CORE_FEATURE_DISCOVERY );
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	// Removing the notification from the queue lets the next notice in the
	// area take its place, and clearing the pending setup ends the
	// return-from-setup visit, so the notice is shown only once.
	function onDismiss() {
		dismissNotification( id );
		receivePendingSetup( null );
	}

	if ( ! slug ) {
		return null;
	}

	const gaTrackingEventArgs = {
		category: `${ viewContext }_${ FEATURE_SETUP_SUCCESS_NOTIFICATION_EVENT_ID }`,
		label: slug,
	};

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			<FeatureSuccessNotice
				slug={ slug }
				onDismiss={ onDismiss }
				trackViewEvent={ false }
			/>
		</Notification>
	);
};

export default FeatureDiscoverySetupSuccessNotification;
