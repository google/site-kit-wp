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
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import { INCOMPLETE_SETUP_REMINDER_NOTIFICATION_EVENT_ID } from '@/js/components/feature-discovery/constants';
import { FEATURE_DISCOVERY_CALLOUT_NOTIFICATION } from '@/js/components/feature-discovery/FeatureDiscoveryCallout';
import { FEATURES_MENU_BUTTON_CLASS } from '@/js/components/FeaturesMenu/constants';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import {
	CORE_FEATURE_DISCOVERY,
	INCOMPLETE_SETUP_TOOLTIP_DISMISSED_ITEM_SLUG,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureIncompleteSetupReminderKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useViewContext from '@/js/hooks/useViewContext';

interface IncompleteSetupReminderNotificationProps {
	id: string;
	Notification: ElementType;
}

const IncompleteSetupReminderNotification: FC<
	IncompleteSetupReminderNotificationProps
> = ( { id, Notification } ) => {
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { removeNotificationFromQueue } = useDispatch( CORE_NOTIFICATIONS );
	const { dismissItem } = useDispatch( CORE_USER );

	const viewContext = useViewContext();

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

	const isCalloutDismissed = useSelect(
		( select: Select ): boolean =>
			select( CORE_NOTIFICATIONS ).isNotificationDismissed(
				FEATURE_DISCOVERY_CALLOUT_NOTIFICATION
			),
		[]
	);

	const isTooltipDismissed = useSelect(
		( select: Select ): boolean =>
			select( CORE_USER ).isItemDismissed(
				INCOMPLETE_SETUP_TOOLTIP_DISMISSED_ITEM_SLUG
			),
		[]
	);

	const { incompleteSetupReminder, slug } = feature || {};
	const { description, title, tooltip } = incompleteSetupReminder || {};

	const tooltipSettings = useMemo(
		() => ( {
			content: tooltip,
			dismissLabel: __( 'Got it', 'google-site-kit' ),
			gaTrackingEventLabel: slug,
			onDismiss: () =>
				dismissItem( INCOMPLETE_SETUP_TOOLTIP_DISMISSED_ITEM_SLUG ),
			placement: 'bottom' as const,
			target: `.googlesitekit-add-features-button, .${ FEATURES_MENU_BUTTON_CLASS }`,
			tooltipSlug: INCOMPLETE_SETUP_REMINDER_NOTIFICATION_EVENT_ID,
		} ),
		[ dismissItem, slug, tooltip ]
	);

	const showTooltip = useShowTooltip( tooltipSettings );

	const onDismiss = useCallback( () => {
		if ( isTooltipDismissed || ! tooltip ) {
			return;
		}

		// Keep the "Unlock more Site Kit features" callout from becoming the
		// active notification on this page view, without dismissing it.
		if ( isCalloutDismissed !== true ) {
			removeNotificationFromQueue(
				FEATURE_DISCOVERY_CALLOUT_NOTIFICATION
			);
		}

		showTooltip();
	}, [
		isCalloutDismissed,
		isTooltipDismissed,
		removeNotificationFromQueue,
		showTooltip,
		tooltip,
	] );

	if ( ! description || ! resumeURL || ! slug || ! title ) {
		return null;
	}

	const gaTrackingEventArgs = {
		category: `${ viewContext }_${ INCOMPLETE_SETUP_REMINDER_NOTIFICATION_EVENT_ID }`,
		label: slug,
	};

	return (
		<Notification
			gaTrackingEventArgs={ gaTrackingEventArgs }
			maxViewedDates={ 0 }
		>
			<NoticeNotification
				ctaButton={ {
					label: __( 'Complete setup', 'google-site-kit' ),
					onClick: () => navigateTo( resumeURL ),
				} }
				description={ description }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: onDismiss,
				} }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				notificationID={ id }
				title={ title }
				type={ NOTICE_TYPES.REMINDER }
			/>
		</Notification>
	);
};

export default IncompleteSetupReminderNotification;
