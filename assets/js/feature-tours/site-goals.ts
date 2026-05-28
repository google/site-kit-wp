/**
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import { SITE_GOALS_TOUR } from './constants';

const defaultStepOptions = {
	offset: -2,
	spotlightPadding: 0,
	styles: {
		spotlight: {
			boxSizing: 'content-box',
			paddingTop: '24px',
			paddingBottom: '24px',
			paddingInlineEnd: '24px',
			marginTop: '-24px',
			marginInlineEnd: '-24px',
		},
	},
	placement: 'top' as const,
	isResponsive: true,
};

/**
 * Returns the Site Goals tour config.
 *
 * The tour starts when the user clicks "Show me" on the Site Goals
 * intro modal. It runs three steps on the Site Goals widget. Step 1
 * points at the key action tile group. Step 2 points at the breakdown
 * notice. Step 3 points at the goal drivers. Step 2's copy depends on
 * `isEcommerceOnly`. When it's `true`, step 2 uses the sales copy.
 * When it's `false`, step 2 uses the leads copy.
 *
 * @since n.e.x.t
 *
 * @param params                 Tour params.
 * @param params.isEcommerceOnly True when only ecommerce events are detected. Picks step 2's copy.
 * @return The Site Goals tour config.
 */
export function getSiteGoalsTour( {
	isEcommerceOnly,
}: {
	isEcommerceOnly: boolean;
} ) {
	return {
		slug: SITE_GOALS_TOUR,
		isRepeatable: true,
		contexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		gaEventCategory: ( viewContext: string ) =>
			`${ viewContext }_site-goals-tour`,
		preloadWidgetAreas: [ AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY ],
		steps: [
			{
				...defaultStepOptions,
				target: '.googlesitekit-site-goals-primary-action',
				title: __(
					'Your main goal is front and center',
					'google-site-kit'
				),
				content: __(
					'Track the most important metric (like sales or lead submissions) to understand how your site is helping you reach your goals.',
					'google-site-kit'
				),
			},
			{
				...defaultStepOptions,
				// TODO: Step 2 uses the key action tile as a placeholder. Swap
				// to the breakdown notice target once #12800 ships it.
				target: '.googlesitekit-site-goals-primary-action',
				title: __( 'Get into the details', 'google-site-kit' ),
				content: isEcommerceOnly
					? __(
							'Want to see whether WooCommerce or Easy Digital Downloads is driving more success? You can break these numbers down to see the performance of each plugin.',
							'google-site-kit'
					  )
					: __(
							'Want to know which specific form is bringing in the most interest? You can break these numbers down to see the performance of each individual form on your site.',
							'google-site-kit'
					  ),
			},
			{
				...defaultStepOptions,
				target: '.googlesitekit-site-goals-goal-drivers-group',
				title: __( 'Find what drives success', 'google-site-kit' ),
				content: __(
					'Discover which traffic channels or locations are bringing in the best results, so you can focus on what works. Customize this list with metrics that matter the most to you.',
					'google-site-kit'
				),
			},
		],
	};
}
