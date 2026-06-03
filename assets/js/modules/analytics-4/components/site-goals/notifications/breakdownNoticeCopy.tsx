/**
 * Site Goals breakdown notice copy.
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
import Link from '@/js/components/Link';
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
 * render the same strings without duplicating them at each call site. The
 * description includes the "Learn more" link, mirroring the other Site Goals
 * components.
 *
 * @since n.e.x.t
 *
 * @param {string} goalType The goal type the notice is shown for.
 * @return {BreakdownNoticeCopy} The `title`, `description` and `ctaLabel`.
 */
export function getBreakdownNoticeCopy(
	goalType: GoalType
): BreakdownNoticeCopy {
	const ctaLabel = __( 'Get breakdown', 'google-site-kit' );
	const learnMore = {
		a: (
			<Link
				// TODO: Update with the actual link to the Site Goals documentation.
				href="#site-goals"
				aria-label={ __(
					'Learn more about site goals',
					'google-site-kit'
				) }
				external
				hideExternalIndicator
			/>
		),
	};

	if ( goalType === GOAL_TYPES.ECOMMERCE ) {
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
				learnMore
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
			learnMore
		),
		ctaLabel,
	};
}
