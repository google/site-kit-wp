/**
 * Site Goals partial data badge.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import BadgeWithTooltip from '@/js/components/BadgeWithTooltip';
import {
	MODULES_ANALYTICS_4,
	RESOURCE_TYPE_CUSTOM_DIMENSION,
} from '@/js/modules/analytics-4/datastore/constants';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import { getLocale } from '@/js/util';

interface PartialDataBadgeProps {
	// The breakdown custom dimension to report partial-data state for.
	customDimensionSlug: string;
}

/**
 * Formats a YYYYMMDD availability date as a localized long-form date, e.g.
 * `20260519` → "May 19, 2026", or an empty string when it's missing/invalid
 * (e.g. `0`, which can occur while the resource is still partial).
 *
 * @since n.e.x.t
 *
 * @param {number} [availabilityDate] Availability date as a YYYYMMDD number.
 * @return {string} The localized date, or an empty string.
 */
function formatStartDate( availabilityDate?: number ): string {
	const value = String( availabilityDate ?? '' );

	if ( value.length !== 8 ) {
		return '';
	}

	const date = parseDimensionStringToDate( value );

	if ( ! date ) {
		return '';
	}

	return new Intl.DateTimeFormat( getLocale(), {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	} ).format( date as Date );
}

const PartialDataBadge: FC< PartialDataBadgeProps > = ( {
	customDimensionSlug,
} ) => {
	const isPartialData = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isCustomDimensionPartialData(
				customDimensionSlug
			),
		[ customDimensionSlug ]
	);
	const availabilityDate = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getResourceDataAvailabilityDate(
				customDimensionSlug,
				RESOURCE_TYPE_CUSTOM_DIMENSION
			),
		[ customDimensionSlug ]
	) as number | undefined;

	if ( ! isPartialData ) {
		return null;
	}

	// The start date may be 0/unknown while still partial; the tooltip then omits
	// it.
	const date = formatStartDate( availabilityDate );
	const tooltipTitle = date
		? sprintf(
				/* translators: %s: date the breakdown began collecting data, e.g. "May 19, 2026". */
				__(
					'Breakdown data tracking began on %s. We’re still collecting full data for your selected dashboard timeframe and previous period comparisons.',
					'google-site-kit'
				),
				date
		  )
		: __(
				'We’re still collecting full data for your selected dashboard timeframe and previous period comparisons.',
				'google-site-kit'
		  );

	return (
		<BadgeWithTooltip
			className="googlesitekit-site-goals-partial-data-badge"
			label={ __( 'Partial data', 'google-site-kit' ) }
			tooltipTitle={ tooltipTitle }
		/>
	);
};

export default PartialDataBadge;
