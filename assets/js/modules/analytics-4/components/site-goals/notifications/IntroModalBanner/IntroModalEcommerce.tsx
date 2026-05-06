/**
 * IntroModalEcommerce component.
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
// @ts-expect-error - We need to add types for imported SVGs.
import SiteGoalsIntroModalEcommerceGraphic from '@/svg/graphics/site-goals-intro-modal-ecommerce.svg';
import Link from '@/js/components/Link';
import type { IntroModalVariantProps } from './types';

const IntroModalEcommerce: FC< IntroModalVariantProps > = ( {
	onView,
	onConfirm,
	onClickLearnMore,
	onDismiss,
} ) => {
	return (
		<BannerModal
			Graphic={ SiteGoalsIntroModalEcommerceGraphic }
			onView={ onView }
			onClose={ onDismiss }
			title={ __( 'See what drives your sales', 'google-site-kit' ) }
			description={ createInterpolateElement(
				__(
					'Understand which parts of your site are most effective at turning visitors into customers. This new section shows you exactly which pages, cities, and traffic sources are bringing in the most sales and actions like add to cart. Use these insights to see what works best for your business so you can focus on the areas that help you grow. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href="#site-goals" // TODO: Update with actual link to site goal's documentation.
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
		/>
	);
};

export default IntroModalEcommerce;
