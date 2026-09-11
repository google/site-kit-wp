/**
 * Site Goals removal notice copy hook.
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

export interface SiteGoalsRemovalNoticeCopy {
	/** The notice heading, which names the removed widget. */
	title: string;
	/** The notice body, which ends with a `Learn more` link to the conversion tracking support page. */
	description: ReactNode;
}

/**
 * Gets the widget removal notice copy for a goal type.
 *
 * @since n.e.x.t
 *
 * @param {GoalType} goalType The goal type of the widget that shows the notice.
 * @return {SiteGoalsRemovalNoticeCopy} The `title` and `description`.
 */
export function useSiteGoalsRemovalNoticeCopy(
	goalType: GoalType
): SiteGoalsRemovalNoticeCopy {
	const learnMoreURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL(
				'plugin-conversion-tracking'
			),
		[]
	) as string;

	const learnMore = (
		<Link href={ learnMoreURL } external hideExternalIndicator />
	);

	if ( goalType === GOAL_TYPES.ECOMMERCE ) {
		return {
			title: __(
				'Online store performance was removed from your dashboard',
				'google-site-kit'
			),
			description: createInterpolateElement(
				__(
					'Site Kit can no longer find the plugin used to track your online store. If you reinstall the plugin, we’ll resume tracking your online store data. For now, this section will be removed from your dashboard. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMore }
			),
		};
	}

	return {
		title: __(
			'Lead generation performance was removed from your dashboard',
			'google-site-kit'
		),
		description: createInterpolateElement(
			__(
				'Site Kit can no longer find the plugin used to track your forms. If you reinstall the plugin, we’ll resume tracking your forms data. <a>Learn more</a>',
				'google-site-kit'
			),
			{ a: learnMore }
		),
	};
}
