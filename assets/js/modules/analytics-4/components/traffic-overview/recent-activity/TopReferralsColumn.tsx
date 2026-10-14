/**
 * Recent activity top referrals column.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TableTile } from '@/js/modules/analytics-4/components/common/tiles';
import { useRecentTrafficBreakdownColumn } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useRecentTrafficBreakdownColumn';
import { getTopReferralsReportOptions } from './reportOptions';

const TopReferralsColumn: FC = () => {
	const { rows, loading, error, retry } = useRecentTrafficBreakdownColumn(
		getTopReferralsReportOptions
	);

	return (
		<TableTile
			title={ __( 'Top referrals by visitors', 'google-site-kit' ) }
			titleAs="h4"
			rows={ rows }
			loading={ loading }
			error={ error }
			onRetry={ retry }
			zeroState={
				<span>
					{ __(
						'No data to display: no traffic from other sites to yours',
						'google-site-kit'
					) }
				</span>
			}
		/>
	);
};

export default TopReferralsColumn;
