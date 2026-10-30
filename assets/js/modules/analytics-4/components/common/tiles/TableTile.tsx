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
import { ComponentType, FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import PreviewBlock from '@/js/components/PreviewBlock';
import ReportError from '@/js/components/ReportError';
import TileShell, { TileShellProps } from './TileShell';
import TileZeroDataMessage, { MetricLabel } from './TileZeroDataMessage';

export interface TableTileRow {
	/** Row label, shown as a link when the row has a `url`. */
	label: string;
	/** Row value, such as a visitor count. */
	value: string | number;
	/** A second value shown after `value`, such as a share of the total. */
	secondaryValue?: string | number;
	/** URL the label links to, opened in a new tab. */
	url?: string;
	/** Page path of a row that lists a page, which `TableTile` itself doesn't render. */
	pagePath?: string;
}

export interface TableTileErrorProps {
	/** The tile's error. */
	error: unknown;
	/** The tile's `onRetry`, where it has one. */
	onRetry?: () => void;
}

export interface TableTileProps {
	/** Title shown at the top of the tile. */
	title: string;
	/** Heading element of the title, `h3` by default. */
	titleAs?: TileShellProps[ 'titleAs' ];
	/** Header label after the title, such as a column name. */
	headerLabel?: string;
	/** Rows to render, with the zero state shown when there are none. */
	rows?: TableTileRow[];
	/** Whether to show loading placeholders in place of the rows. */
	loading?: boolean;
	/** Error to show in place of the rows, as a `ReportError` unless `ErrorComponent` is passed. */
	error?: unknown;
	/** Maximum number of rows to show, or every row when not set. */
	limit?: number;
	/** Metric in the zero state message: `visitors` by default, `sales`, or `leads`. */
	noDataMetricLabel?: MetricLabel;
	/** Content shown in place of the default zero state message. */
	zeroState?: ReactNode;
	/** Called on a "Retry" click in the error state, to request a report with fetch options, such as `cacheTTL`, again. Passing `onRetry` also shows "Retry" for a retryable error of a selector other than `getReport`. */
	onRetry?: () => void;
	/** Component that renders the error state, with `error` and `onRetry`, in place of a `ReportError`. */
	ErrorComponent?: ComponentType< TableTileErrorProps >;
}

const TableTile: FC< TableTileProps > = ( {
	title,
	titleAs,
	headerLabel,
	rows = [],
	loading = false,
	error,
	limit,
	noDataMetricLabel,
	zeroState,
	onRetry,
	ErrorComponent,
} ) => {
	const visibleRows = rows.slice( 0, limit || rows.length );

	return (
		<TileShell
			baseClassName="googlesitekit-table-tile"
			title={ title }
			titleAs={ titleAs }
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
					{ ErrorComponent ? (
						<ErrorComponent error={ error } onRetry={ onRetry } />
					) : (
						<ReportError
							moduleSlug="analytics-4"
							error={ error }
							onRetry={ onRetry }
						/>
					) }
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
