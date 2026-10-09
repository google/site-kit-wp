/**
 * Recent activity latest post traffic sources.
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
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import { useReportState } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useReportState';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import LatestPostMetricRow from './LatestPostMetricRow';
import LatestPostTile from './LatestPostTile';
import {
	PostReportArgs,
	getTopChannelReportOptions,
	getTopKeywordReportOptions,
	getTopReferrerReportOptions,
} from './postReportOptions';

/** The value a row shows when its report has no rows. */
const NO_VALUE = '-';

interface SearchConsoleRow {
	/** The values of the report's dimensions, e.g. the search query. */
	keys?: string[];
}

interface TrafficSourcesGroupProps {
	/** The post's permalink and the date range of its reports. */
	reportArgs: PostReportArgs;
}

/**
 * Gets the dimension value of the first row of a report, which is the top
 * value of a report ordered by visitors.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] The report, which is `undefined` while it loads.
 * @return {string} The dimension value, or `NO_VALUE` when the report has no rows.
 */
function getTopDimensionValue( report?: Report ): string {
	return report?.rows?.[ 0 ]?.dimensionValues?.[ 0 ]?.value || NO_VALUE;
}

const TrafficSourcesGroup: FC< TrafficSourcesGroupProps > = ( {
	reportArgs,
} ) => {
	const canViewSearchConsole = useCanViewSharedModule(
		MODULE_SLUG_SEARCH_CONSOLE
	);

	const topChannelReportOptions = useMemo(
		() => getTopChannelReportOptions( reportArgs ),
		[ reportArgs ]
	);
	const topReferrerReportOptions = useMemo(
		() => getTopReferrerReportOptions( reportArgs ),
		[ reportArgs ]
	);
	const topKeywordReportOptions = useMemo(
		() =>
			canViewSearchConsole
				? getTopKeywordReportOptions( reportArgs )
				: undefined,
		[ canViewSearchConsole, reportArgs ]
	);

	const topChannel = useReportState< Report >(
		MODULES_ANALYTICS_4,
		topChannelReportOptions
	);
	const topReferrer = useReportState< Report >(
		MODULES_ANALYTICS_4,
		topReferrerReportOptions
	);
	const topKeyword = useReportState< SearchConsoleRow[] >(
		MODULES_SEARCH_CONSOLE,
		topKeywordReportOptions
	);

	return (
		<LatestPostTile title={ __( 'Traffic sources', 'google-site-kit' ) }>
			<LatestPostMetricRow
				label={ __( 'Top traffic source', 'google-site-kit' ) }
				value={ getTopDimensionValue( topChannel.report ) }
				loading={ topChannel.loading }
				error={ topChannel.error }
			/>
			<LatestPostMetricRow
				label={ __( 'Top referring site', 'google-site-kit' ) }
				value={ getTopDimensionValue( topReferrer.report ) }
				loading={ topReferrer.loading }
				error={ topReferrer.error }
			/>
			{ canViewSearchConsole && (
				<LatestPostMetricRow
					label={ __( 'Top keyword', 'google-site-kit' ) }
					value={ topKeyword.report?.[ 0 ]?.keys?.[ 0 ] || NO_VALUE }
					loading={ topKeyword.loading }
					error={ topKeyword.error }
					moduleSlug={ MODULE_SLUG_SEARCH_CONSOLE }
				/>
			) }
		</LatestPostTile>
	);
};

export default TrafficSourcesGroup;
