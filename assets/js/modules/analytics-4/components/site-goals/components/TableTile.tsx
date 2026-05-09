/**
 * Site Goals table tile component.
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
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import ZeroDataMessage from './ZeroDataMessage';

export interface TableTileRow {
	label: string;
	value: string | number;
	url?: string;
	pagePath?: string;
}

export interface TableTileProps {
	title: string;
	headerLabel?: string;
	rows?: TableTileRow[];
	limit?: number;
	noDataMetricLabel?: string;
}

const TableTile: FC< TableTileProps > = ( {
	title,
	headerLabel,
	rows = [],
	limit,
	noDataMetricLabel,
} ) => {
	const visibleRows = rows.slice( 0, limit || rows.length );

	return (
		<div className="googlesitekit-table-tile">
			<div className="googlesitekit-table-tile__header">
				<Typography
					as="h3"
					type="title"
					size="small"
					className="googlesitekit-table-tile__title"
				>
					{ title }
				</Typography>
				{ !! headerLabel && (
					<Typography
						as="span"
						type="body"
						size="medium"
						className="googlesitekit-table-tile__header-label"
					>
						{ headerLabel }
					</Typography>
				) }
			</div>

			<div className="googlesitekit-table-tile__body">
				{ rows.length === 0 && (
					<div className="googlesitekit-table-tile__zero-state">
						<ZeroDataMessage metricLabel={ noDataMetricLabel } />
					</div>
				) }

				{ rows.length > 0 && (
					<div className="googlesitekit-table-tile__rows">
						{ visibleRows.map( ( row, index ) => (
							<div
								key={ `${ row.label }-${ index }` }
								className="googlesitekit-table-tile__row"
							>
								<div className="googlesitekit-table-tile__cell googlesitekit-table-tile__cell--label">
									{ row.url ? (
										<Link
											href={ row.url }
											title={ row.label }
											external
											hideExternalIndicator
										>
											{ row.label }
										</Link>
									) : (
										<span>{ row.label }</span>
									) }
								</div>
								<div className="googlesitekit-table-tile__cell googlesitekit-table-tile__cell--value">
									{ row.value }
								</div>
							</div>
						) ) }
					</div>
				) }
			</div>
		</div>
	);
};

export default TableTile;
