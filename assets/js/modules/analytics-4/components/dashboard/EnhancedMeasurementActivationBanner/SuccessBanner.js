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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import SuccessGreenSVG from '../../../../../../svg/graphics/ga4-success-green.svg';
import useViewContext from '../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../util';
import NotificationWithSmallRightSVG from '../../../../../googlesitekit/notifications/components/layout/NotificationWithSmallRightSVG';
import Description from '../../../../../googlesitekit/notifications/components/common/Description';
import CTALink from '../../../../../googlesitekit/notifications/components/common/CTALink';
import LearnMoreLink from '../../../../../googlesitekit/notifications/components/common/LearnMoreLink';

export default function SuccessBanner( { id, Notification } ) {
	const viewContext = useViewContext();

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	// This event is not auto-tracked by the new <Notification> component because it
	// considers EnhancedMeasurementActivationBanner (SetupBanner variant) as already
	// viewed and doesn't track the view again when the SuccessBanner variant is displayed.
	useEffect( () => {
		trackEvent(
			`${ viewContext }_enhanced-measurement-success`,
			'view_notification'
		);
	}, [ viewContext ] );

	const gaTrackingEventArgs = {
		category: `${ viewContext }_enhanced-measurement-success`,
	};

	return (
		<Notification className="googlesitekit-publisher-win googlesitekit-enhanced-measurement-success-banner">
			<NotificationWithSmallRightSVG
				title={ __(
					'You successfully enabled enhanced measurement for your site',
					'google-site-kit'
				) }
				description={
					<Description
						text={ __(
							'Your configured Analytics web data stream will now automatically measure interactions on your site in addition to standard page views measurement.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ documentationURL }
							/>
						}
					/>
				}
				actions={
					// Using <CTALink> instead of <Dismiss> to automatically use `confirm_notification`
					// GA tracking event which was used in the legacy component.
					<CTALink
						id={ id }
						ctaLabel={ __( 'OK, Got it', 'google-site-kit' ) }
						gaTrackingEventArgs={ gaTrackingEventArgs }
						dismissOnCTAClick
						dismissOptions={ { skipHidingFromQueue: false } } // We want the notification to now be removed from the queue as this is the final "step".
					/>
				}
				SVG={ () => <SuccessGreenSVG /> }
			/>
		</Notification>
	);
}
