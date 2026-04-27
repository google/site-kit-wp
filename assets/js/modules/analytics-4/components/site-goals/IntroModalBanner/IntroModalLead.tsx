/**
 * IntroModalLead component.
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
import { useCallback } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BannerModal from '@/js/components/BannerModal';
// @ts-expect-error - We need to add types for imported SVGs.
import SiteGoalsIntroModalGraphic from '@/svg/graphics/site-goals-intro-modal.svg';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import Link from '@/js/components/Link';
import {
	IntroModalVariantProps,
	SITE_GOALS_INTRO_MODAL_BANNER,
} from '@/js/modules/analytics-4/components/site-goals/IntroModalBanner/index';

export default function IntroModalLead( { onClose }: IntroModalVariantProps ) {
	const trackEvent = useNotificationEvents( SITE_GOALS_INTRO_MODAL_BANNER );

	const handleView = useCallback( () => {
		trackEvent.view( 'lead' );
	}, [ trackEvent ] );

	const handleConfirm = useCallback( () => {
		trackEvent.confirm( 'lead' );
		onClose();
	}, [ trackEvent, onClose ] );

	const handleClickLearnMore = useCallback( () => {
		trackEvent.clickLearnMore( 'lead' );
	}, [ trackEvent ] );

	const handleDismiss = useCallback( () => {
		trackEvent.dismiss( 'lead' );
		onClose();
	}, [ trackEvent, onClose ] );

	return (
		<BannerModal
			Graphic={ SiteGoalsIntroModalGraphic }
			onView={ handleView }
			onClose={ handleDismiss }
			title={ __( 'See what brings in new leads', 'google-site-kit' ) }
			description={ createInterpolateElement(
				__(
					'Discover which parts of your site are most successful at encouraging people to reach out. This new section highlights the specific pages, locations, and visitor groups that result in more sign-ups, quote requests, and other important goals. These details help you understand exactly where your most interested visitors are coming from. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						//
						<Link
							// @ts-expect-error `Link` component is not currently typed.
							href="#site-goals" // TODO: Update with actual link to site goals documentation.
							aria-label={ __(
								'Learn more about site goals',
								'google-site-kit'
							) }
							onClick={ handleClickLearnMore }
							external
							hideExternalIndicator
						/>
					),
				}
			) }
			ctaButton={ {
				label: __( 'Show me', 'google-site-kit' ),
				onClick: handleConfirm,
			} }
			dismissButton={ {
				onClick: handleDismiss,
			} }
		/>
	);
}
