/**
 * Recent activity latest post engagement and outcomes.
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
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { useReportState } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useReportState';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import LatestPostMetricRow from './LatestPostMetricRow';
import LatestPostReportError from './LatestPostReportError';
import LatestPostTile from './LatestPostTile';
import {
	PostReportArgs,
	getEngagementReportOptions,
	getPurchasesReportOptions,
} from './postReportOptions';
import { getMetricValue } from './utils/getMetricValue';

interface EngagementOutcomesGroupProps {
	/** The post's permalink and the date range of its reports. */
	reportArgs: PostReportArgs;
}

const EngagementOutcomesGroup: FC< EngagementOutcomesGroupProps > = ( {
	reportArgs,
} ) => {
	const hasPurchaseEvent: boolean | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasConversionReportingEvents(
				ENUM_CONVERSION_EVENTS.PURCHASE
			),
		[]
	);
	// The detected events come with the Analytics settings, so they stay unknown
	// when the settings request fails.
	const settingsError = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getSettings' ),
		[]
	);

	const engagementReportOptions = useMemo(
		() => getEngagementReportOptions( reportArgs ),
		[ reportArgs ]
	);
	const purchasesReportOptions = useMemo(
		() =>
			hasPurchaseEvent
				? getPurchasesReportOptions( reportArgs )
				: undefined,
		[ hasPurchaseEvent, reportArgs ]
	);

	const engagement = useReportState< Report >(
		MODULES_ANALYTICS_4,
		engagementReportOptions
	);
	const purchases = useReportState< Report >(
		MODULES_ANALYTICS_4,
		purchasesReportOptions
	);

	const engagementRow = engagement.report?.rows?.[ 0 ];

	return (
		<LatestPostTile
			title={ __( 'Engagement & outcomes', 'google-site-kit' ) }
		>
			{ ! engagement.loading && !! engagement.error ? (
				<LatestPostReportError error={ engagement.error } />
			) : (
				<Fragment>
					<LatestPostMetricRow
						label={ __( 'Session Duration', 'google-site-kit' ) }
						value={ numFmt( getMetricValue( engagementRow ), 's' ) }
						loading={ engagement.loading }
					/>
					<LatestPostMetricRow
						label={ __( 'Engaged sessions', 'google-site-kit' ) }
						value={ numFmt( getMetricValue( engagementRow, 1 ) ) }
						loading={ engagement.loading }
					/>
				</Fragment>
			) }
			{ hasPurchaseEvent !== false && (
				<LatestPostMetricRow
					label={ __(
						'Purchases affected by post',
						'google-site-kit'
					) }
					value={ numFmt(
						getMetricValue( purchases.report?.rows?.[ 0 ] )
					) }
					// The row loads until the detected events show whether
					// the site has a purchase event, or the settings fail.
					loading={
						( hasPurchaseEvent === undefined && ! settingsError ) ||
						purchases.loading
					}
					error={ settingsError || purchases.error }
				/>
			) }
		</LatestPostTile>
	);
};

export default EngagementOutcomesGroup;
