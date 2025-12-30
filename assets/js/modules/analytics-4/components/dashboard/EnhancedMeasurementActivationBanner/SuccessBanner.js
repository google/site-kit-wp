/**
 * EnhancedMeasurementActivationBanner > SuccessBanner component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';

export default function SuccessBanner( { id, Notification } ) {
	const viewContext = useViewContext();

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	// All three variations (SetupBanner, InProgressBanner and SuccessBanner) are under a single parent
	// (EnhancedMeasurementActivationBanner). The <Notification> component wrapping all of them share
	// the same "notification ID". So this event is not auto-tracked by the new <Notification> component.
	// It considers the EnhancedMeasurementActivationBanner as already viewed when SetupBanner is
	// rendered and doesn't track the view again when the SuccessBanner variant is rendered.
	const handleView = useCallback( () => {
		trackEvent(
			`${ viewContext }_enhanced-measurement-success`,
			'view_notification'
		);
	}, [ viewContext ] );

	const trackEvents = useNotificationEvents( id );

	const gaTrackingEventArgs = {
		category: `${ viewContext }_enhanced-measurement-success`,
	};

	function learnMoreTrackEvent() {
		trackEvents.clickLearnMore(
			gaTrackingEventArgs.label,
			gaTrackingEventArgs.value
		);
	}

	return (
		<Notification onView={ handleView }>
			<NoticeNotification
				notificationID={ id }
				type={ Notice.TYPES.SUCCESS }
				title={ __(
					'You successfully enabled enhanced measurement for your site',
					'google-site-kit'
				) }
				description={ createInterpolateElement(
					__(
						'Your configured Analytics web data stream will now automatically measure interactions on your site in addition to standard page views measurement. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<Link
								href={ documentationURL }
								onClick={ learnMoreTrackEvent }
								external
							/>
						),
					}
				) }
				gaTrackingEventArgs={ gaTrackingEventArgs }
			/>
		</Notification>
	);
}

SuccessBanner.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType,
};
