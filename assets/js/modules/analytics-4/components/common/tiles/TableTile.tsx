/**
 * TableTile component.
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
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import PreviewBlock from '@/js/components/PreviewBlock';
import ReportError from '@/js/components/ReportError';
import TileShell from './TileShell';
import TileZeroDataMessage, { MetricLabel } from './TileZeroDataMessage';

export interface TableTileRow {
	label: string;
	value: string | number;
	/** A second value shown after `value`, such as a share of the total. */
	secondaryValue?: string | number;
	url?: string;
	pagePath?: string;
}

export interface TableTileProps {
	title: string;
	headerLabel?: string;
	rows?: TableTileRow[];
	loading?: boolean;
	error?: unknown;
	onRetry?: () => void;
	limit?: number;
	noDataMetricLabel?: MetricLabel;
	zeroState?: ReactNode;
}

const TableTile: FC< TableTileProps > = ( {
	title,
	headerLabel,
	rows = [],
	loading = false,
	error,
	onRetry,
	limit,
	noDataMetricLabel,
	zeroState,
} ) => {
	const visibleRows = rows.slice( 0, limit || rows.length );

	return (
		<TileShell
			baseClassName="googlesitekit-table-tile"
			title={ title }
			headerLabel={ headerLabel }
		>
			{ loading && (
				<div className="googlesitekit-table-tile__loading">
					<PreviewBlock width="100%" height="18px" />
					<PreviewBlock width="100%" height="18px" />
					<PreviewBlock width="100%" height="18px" />
				</div>
			) }

			{ ! loading && !! error && (
				<div className="googlesitekit-table-tile__error">
					<ReportError
						moduleSlug="analytics-4"
						error={ error }
						onRetry={ onRetry }
					/>
				</div>
			) }

			{ ! loading && ! error && rows.length === 0 && (
				<div className="googlesitekit-table-tile__zero-state">
					{ zeroState || (
						<TileZeroDataMessage
							metricLabel={ noDataMetricLabel || 'visitors' }
						/>
					) }
				</div>
			) }

			{ ! loading && ! error && rows.length > 0 && (
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
								{ row.secondaryValue !== undefined && (
									<span className="googlesitekit-table-tile__secondary-value">
										{ row.secondaryValue }
									</span>
								) }
							</div>
						</div>
					) ) }
				</div>
			) }
		</TileShell>
	);
};

export default TableTile;
