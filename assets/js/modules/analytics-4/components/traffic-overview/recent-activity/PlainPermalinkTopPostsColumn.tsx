/**
 * Recent activity top posts column for a site with plain permalinks.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { TableTile } from '@/js/modules/analytics-4/components/common/tiles';
import { FreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { usePlainPermalinkTopPostsColumn } from '@/js/modules/analytics-4/components/traffic-overview/hooks/usePlainPermalinkTopPostsColumn';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getPlainPermalinkTopPostsReportOptions } from './reportOptions';

const PlainPermalinkTopPostsColumn: FC = () => {
	const excludedProducts = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getExcludedProducts(),
		[]
	);

	// The options wait for the product pages to leave out, so the report isn't
	// requested first without its product filter.
	const buildReportOptions = useCallback(
		( dateRange: FreshDataDateRange ) =>
			excludedProducts === undefined
				? undefined
				: getPlainPermalinkTopPostsReportOptions(
						dateRange,
						excludedProducts
				  ),
		[ excludedProducts ]
	);

	const { rows, total, loading, error, retry } =
		usePlainPermalinkTopPostsColumn(
			buildReportOptions,
			excludedProducts?.by === 'queryVar'
				? excludedProducts.postType
				: null
		);

	return (
		<TableTile
			title={ __( 'Top posts by visitors', 'google-site-kit' ) }
			titleAs="h4"
			rows={ rows }
			loading={ loading }
			error={ error }
			onRetry={ retry }
			// The site can have views that no row shows, such as the views of
			// a search.
			zeroState={
				total > 0 ? (
					<span>
						{ __(
							'No data to display: your posts haven’t received any visitors yet',
							'google-site-kit'
						) }
					</span>
				) : undefined
			}
		/>
	);
};

export default PlainPermalinkTopPostsColumn;
