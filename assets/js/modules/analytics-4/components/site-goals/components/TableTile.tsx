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
import type { FC, ReactElement, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import MetricTileTable from '@/js/components/KeyMetrics/MetricTileTable';
import Link from '@/js/components/Link';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';

interface InlineTileWidgetProps {
	children: ReactNode;
}

function InlineTileWidget( { children }: InlineTileWidgetProps ) {
	return children as ReactElement;
}

export interface TableTileRow {
	label: string;
	value: string | number;
	url?: string;
}

interface TableTileLabelCellProps {
	row: TableTileRow;
	fieldValue?: unknown;
}

function TableTileLabelCell( {
	row,
	fieldValue,
}: TableTileLabelCellProps ): ReactElement {
	const label = String( fieldValue ?? '' );

	if ( row.url ) {
		return (
			<Link
				href={ row.url }
				title={ label }
				external
				hideExternalIndicator
			>
				{ label }
			</Link>
		);
	}

	return <span>{ label }</span>;
}

export interface TableTileProps {
	title: string;
	headerLabel?: string;
	rows?: TableTileRow[];
	loading?: boolean;
	error?: unknown;
	limit?: number;
	noDataMetricLabel?: string;
}

const TableTile: FC< TableTileProps > = ( {
	title,
	headerLabel,
	rows = [],
	loading = false,
	error,
	limit,
	noDataMetricLabel,
} ) => {
	function ZeroState() {
		return <ZeroDataMessage metricLabel={ noDataMetricLabel } />;
	}

	return (
		<div className="googlesitekit-table-tile">
			<MetricTileTable
				Widget={ InlineTileWidget }
				title={ title }
				headerLabel={ headerLabel }
				moduleSlug="analytics-4"
				rows={ rows }
				columns={ [
					{
						field: 'label',
						Component: TableTileLabelCell,
						className:
							'googlesitekit-table-tile__cell googlesitekit-table-tile__cell--label',
					},
					{
						field: 'value',
						className:
							'googlesitekit-table-tile__cell googlesitekit-table-tile__cell--value',
					},
				] }
				loading={ loading }
				error={ error }
				limit={ limit }
				ZeroState={ ZeroState }
			/>
		</div>
	);
};

export default TableTile;
