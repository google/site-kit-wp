/**
 * Site Goals breakdown notice copy hook.
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
import { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

export interface BreakdownNoticeCopy {
	title: string;
	description: ReactNode;
	ctaLabel: string;
}

/**
 * Gets the breakdown notice copy for a goal type.
 *
 * Single source of truth for the notice copy so the widgets and the Side Panel
 * render the same strings without duplicating them at each call site. This is a
 * hook (rather than a plain function) so the "Learn more" documentation URL can
 * be resolved from the data store here, instead of being passed in awkwardly
 * from every caller.
 *
 * @since n.e.x.t
 *
 * @param {string} goalType The goal type the notice is shown for.
 * @return {BreakdownNoticeCopy} The `title`, `description` and `ctaLabel`.
 */
export function useSiteGoalsBreakdownNoticeCopy(
	goalType: GoalType
): BreakdownNoticeCopy {
	const documentationURL = useSelect(
		( select: Select ) =>
			// TODO: Replace the `site-goals` slug once the Site Goals
			// documentation page is available.
			select( CORE_SITE ).getDocumentationLinkURL( 'site-goals' ),
		[]
	);
	const hasMultipleEcommerceProviders = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).hasMultipleActiveEcommerceEventProviders(),
		[]
	);

	const ctaLabel = __( 'Get breakdown', 'google-site-kit' );
	const learnMoreLink = (
		<Link
			href={ documentationURL }
			aria-label={ __(
				'Learn more about site goals',
				'google-site-kit'
			) }
			external
			hideExternalIndicator
		/>
	);

	if ( goalType === GOAL_TYPES.ECOMMERCE ) {
		// Two ecommerce plugins active (WooCommerce + Easy Digital Downloads):
		// the breakdown separates the two stores.
		if ( hasMultipleEcommerceProviders ) {
			return {
				title: __(
					'Using both WooCommerce and Easy Digital Downloads to sell products or services?',
					'google-site-kit'
				),
				description: createInterpolateElement(
					__(
						'If you use both WooCommerce and Easy Digital Downloads, your events data might be grouped together. Enable this breakdown to see results for each plugin separately and track how each store is performing. Because this uses a new, more precise tracking method, your data will start fresh from the moment you turn it on. <a>Learn more</a>',
						'google-site-kit'
					),
					{ a: learnMoreLink }
				),
				ctaLabel,
			};
		}

		// A single ecommerce plugin active: the breakdown separates results by
		// plugin (source) more generally.
		return {
			title: __(
				'See exactly which plugins are driving your results',
				'google-site-kit'
			),
			description: createInterpolateElement(
				__(
					'Currently, your sales and leads are combined into one total. Enable this breakdown to separate results by plugin and track specific flows. Because this uses a new, more precise tracking method, your data will start fresh from the moment you turn it on. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMoreLink }
			),
			ctaLabel,
		};
	}

	return {
		title: __( 'Want to see results for each form?', 'google-site-kit' ),
		description: createInterpolateElement(
			__(
				'If you use multiple forms, your events data may be grouped together. Enable this breakdown to see results for each form and track how each one is performing. Because this uses a new, more precise tracking method, data collection will start fresh from the moment you turn it on. <a>Learn more</a>',
				'google-site-kit'
			),
			{ a: learnMoreLink }
		),
		ctaLabel,
	};
}
