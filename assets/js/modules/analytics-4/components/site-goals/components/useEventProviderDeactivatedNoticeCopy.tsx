/**
 * Site Goals event provider deactivated notice copy hook.
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

export interface EventProviderDeactivatedNoticeCopy {
	/** The notice heading, which names the kind of plugin Site Kit can no longer find. */
	title: string;
	/** The notice body, which ends with a `Learn more` link to the conversion tracking page. */
	description: ReactNode;
}

/**
 * Gets the deactivated plugin notice copy for a goal type.
 *
 * @since n.e.x.t
 *
 * @param {GoalType} goalType The goal type of the widget that shows the notice.
 * @return {EventProviderDeactivatedNoticeCopy} The `title` and `description`.
 */
export function useEventProviderDeactivatedNoticeCopy(
	goalType: GoalType
): EventProviderDeactivatedNoticeCopy {
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
				'Online store plugin no longer found',
				'google-site-kit'
			),
			description: createInterpolateElement(
				__(
					'Site Kit can no longer find the plugin used to track your online store, which means the data in this section is no longer updating. If you’ve stopped using that plugin, it will automatically be removed from this section soon. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMore }
			),
		};
	}

	return {
		title: __( 'Form plugin no longer found', 'google-site-kit' ),
		description: createInterpolateElement(
			__(
				'Site Kit can no longer find the plugin used to track your forms, which means the form data in this section is no longer updating. If you’ve stopped using that plugin, this form will automatically be removed from this section. <a>Learn more</a>',
				'google-site-kit'
			),
			{ a: learnMore }
		),
	};
}
