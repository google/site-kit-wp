/**
 * Recent activity breakdown column.
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
import {
	TableTile,
	TableTileRow,
} from '@/js/modules/analytics-4/components/common/tiles';

export interface RecentTrafficBreakdownColumnProps {
	/** The column's title, such as "Top channels by visitors". */
	title: string;
	/** The rows to render, empty when no value in the report has visitors. */
	rows: TableTileRow[];
	/** Whether the column's report request has not finished. */
	loading: boolean;
	/** The error of the column's report request, if it failed. */
	error?: unknown;
	/** Requests the column's report again, for the "Retry" button of its error. */
	onRetry: () => void;
}

const RecentTrafficBreakdownColumn: FC<
	RecentTrafficBreakdownColumnProps
> = ( { title, rows, loading, error, onRetry } ) => {
	return (
		<div className="googlesitekit-traffic-overview__breakdown-column">
			<TableTile
				title={ title }
				rows={ rows }
				loading={ loading }
				error={ error }
				onRetry={ onRetry }
				// The column's report covers the whole site, even on an entity
				// dashboard, where the default message of `TableTile` names the
				// page.
				zeroState={ __(
					'No data to display: your site hasn’t received any visitors yet',
					'google-site-kit'
				) }
			/>
		</div>
	);
};

export default RecentTrafficBreakdownColumn;
