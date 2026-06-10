/**
 * Site Goals gathering breakdown data badge.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import BadgeWithTooltip from '@/js/components/BadgeWithTooltip';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

interface GatheringBreakdownDataBadgeProps {
	goalType: GoalType;
	variant?: 'panel' | 'widget';
}

const GatheringBreakdownDataBadge: FC< GatheringBreakdownDataBadgeProps > = ( {
	goalType,
	variant = 'panel',
} ) => {
	// Gate on this section's own breakdown dimension, matching the per-goal-type
	// "New" notice (the ecommerce dimension for the store, the form dimension for
	// lead generation).
	const requiredDimension =
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ goalType ];
	const hasBreakdownDimension = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				requiredDimension
			),
		[ requiredDimension ]
	);

	const isGatheringData = useSelect(
		( select: Select ) =>
			hasBreakdownDimension
				? select(
						MODULES_ANALYTICS_4
				  ).areCustomDimensionsGatheringData( [ requiredDimension ] )
				: undefined,
		[ hasBreakdownDimension, requiredDimension ]
	);

	const isSyncing = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isSyncingAvailableCustomDimensions(),
		[]
	);

	const documentationURL = useSelect(
		( select: Select ) =>
			// TODO: Replace the `site-goals` slug once the Site Goals
			// documentation page is available.
			select( CORE_SITE ).getDocumentationLinkURL( 'site-goals' ),
		[]
	);

	// Avoid a flash while either gating selector is still resolving, or while a
	// dimensions sync is in flight.
	if (
		hasBreakdownDimension === undefined ||
		isGatheringData === undefined ||
		isSyncing
	) {
		return null;
	}

	// Render only while the dimension exists but is still gathering data; the
	// widget transitions to the breakdown view once enough data accumulates.
	if ( ! isGatheringData ) {
		return null;
	}

	const label =
		variant === 'widget'
			? __( 'Gathering breakdown data', 'google-site-kit' )
			: __( 'Gathering data', 'google-site-kit' );

	return (
		<BadgeWithTooltip
			className="googlesitekit-site-goals-gathering-breakdown-data-badge"
			label={ label }
			tooltipTitle={ createInterpolateElement(
				__(
					'We’re still collecting breakdown data for your selected dashboard timeframe and previous period comparisons. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ documentationURL }
							external
							hideExternalIndicator
						/>
					),
				}
			) }
		/>
	);
};

export default GatheringBreakdownDataBadge;
