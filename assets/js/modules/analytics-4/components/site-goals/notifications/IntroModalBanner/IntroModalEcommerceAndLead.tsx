/**
 * IntroModalEcommerceAndLead component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BannerModal from '@/js/components/BannerModal/index';
import SiteGoalsIntroModalGraphic from '@/svg/graphics/site-goals-intro-modal.svg';
import Link from '@/js/components/Link';
import type { IntroModalVariantProps } from './types';

const IntroModalEcommerceAndLead: FC< IntroModalVariantProps > = ( {
	onView,
	onConfirm,
	onClickLearnMore,
	onDismiss,
} ) => {
	return (
		<BannerModal
			className="googlesitekit-banner-modal--site-goals-intro"
			Graphic={ SiteGoalsIntroModalGraphic }
			onView={ onView }
			onClose={ onDismiss }
			title={ __( 'Track your most valuable goals', 'google-site-kit' ) }
			description={ createInterpolateElement(
				__(
					'Discover which channels, cities, and pages are bringing in your best results. A new section shows you exactly how <b>sales</b> and <b>sign ups</b> are performing, so you can focus on the sources that grow your business. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					b: <strong />,
					a: (
						<Link
							// @ts-expect-error `Link` component is not currently typed.
							href="#site-goals" // TODO: Update with actual link to site goals documentation.
							aria-label={ __(
								'Learn more about site goals',
								'google-site-kit'
							) }
							onClick={ onClickLearnMore }
							external
							hideExternalIndicator
						/>
					),
				}
			) }
			ctaButton={ {
				label: __( 'Show me', 'google-site-kit' ),
				onClick: onConfirm,
			} }
			dismissButton={ {
				onClick: onDismiss,
			} }
			newBadge
		/>
	);
};

export default IntroModalEcommerceAndLead;
