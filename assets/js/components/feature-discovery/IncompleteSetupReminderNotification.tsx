/**
 * IncompleteSetupReminderNotification component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureIncompleteSetupReminderKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';

interface IncompleteSetupReminderNotificationProps {
	id: string;
	Notification: ElementType;
}

const IncompleteSetupReminderNotification: FC<
	IncompleteSetupReminderNotificationProps
> = ( { id, Notification } ) => {
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const feature = useSelect(
		( select: Select ): Feature | undefined =>
			select( CORE_FEATURE_DISCOVERY )
				.getFeatures()
				.find(
					( f: Feature ) =>
						getFeatureIncompleteSetupReminderKey( f.slug ) === id
				),
		[ id ]
	);

	const resumeURL = useSelect(
		( select: Select ): string | undefined =>
			feature
				? select( CORE_FEATURE_DISCOVERY ).getFeatureResumeURL(
						feature.slug
				  )
				: undefined,
		[ feature ]
	);

	const { description, title } = feature?.incompleteSetupReminder || {};

	if ( ! description || ! resumeURL || ! title ) {
		return null;
	}

	return (
		<Notification maxViewedDates={ 0 }>
			<NoticeNotification
				ctaButton={ {
					label: __( 'Complete setup', 'google-site-kit' ),
					onClick: () => navigateTo( resumeURL ),
				} }
				description={ description }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
				} }
				notificationID={ id }
				title={ title }
				type={ NOTICE_TYPES.REMINDER }
			/>
		</Notification>
	);
};

export default IncompleteSetupReminderNotification;
