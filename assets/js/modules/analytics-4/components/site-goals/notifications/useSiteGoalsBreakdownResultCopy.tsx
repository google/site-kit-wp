/**
 * Site Goals breakdown result (success/error) copy hook.
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
import { BREAKDOWN_SCOPE_BOTH } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { BreakdownScope } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

export interface BreakdownResultCopy {
	successTitle: string;
	successDescription: ReactNode;
	permissionsErrorTitle: string;
}

export function useSiteGoalsBreakdownResultCopy(
	scope: BreakdownScope
): BreakdownResultCopy {
	const documentationURL = useSelect(
		( select: Select ) =>
			// TODO: Replace the `site-goals` slug once the Site Goals
			// documentation page is available.
			select( CORE_SITE ).getDocumentationLinkURL( 'site-goals' ),
		[]
	);

	const learnMoreLink = (
		<Link href={ documentationURL } external hideExternalIndicator />
	);

	if ( scope === GOAL_TYPES.ECOMMERCE ) {
		return {
			successTitle: __(
				'Success! Event breakdown is now active',
				'google-site-kit'
			),
			successDescription: createInterpolateElement(
				__(
					'Site Kit is now tracking your plugins individually. Because this more precise tracking just started from scratch, your dashboard will show fresh data building up from this moment forward. Individual results will appear soon, with long-term trends following as more data is gathered. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMoreLink }
			),
			permissionsErrorTitle: __(
				'Event breakdown setup failed',
				'google-site-kit'
			),
		};
	}

	// Both goal types were enabled together (the Side Panel's combined notice).
	if ( scope === BREAKDOWN_SCOPE_BOTH ) {
		return {
			successTitle: __(
				'Success! Breakdown is now active',
				'google-site-kit'
			),
			successDescription: createInterpolateElement(
				__(
					'Site Kit is now tracking specific data for your sales and leads. Because this more precise tracking just started from scratch, your dashboard will show fresh data building up from this moment forward. Individual results will appear soon, with long-term trends following as more data is gathered. <a>Learn more</a>',
					'google-site-kit'
				),
				{ a: learnMoreLink }
			),
			permissionsErrorTitle: __(
				'Event breakdown setup failed',
				'google-site-kit'
			),
		};
	}

	return {
		successTitle: __(
			'Success! Individual form tracking is now active',
			'google-site-kit'
		),
		successDescription: createInterpolateElement(
			__(
				'Site Kit is now tracking data for each of your forms individually. Because this more precise tracking just started from scratch, your dashboard will show fresh data building up from this moment forward. Individual results will appear soon, with long-term trends following as more data is gathered. <a>Learn more</a>',
				'google-site-kit'
			),
			{ a: learnMoreLink }
		),
		permissionsErrorTitle: __(
			'Individual form tracking setup failed',
			'google-site-kit'
		),
	};
}
