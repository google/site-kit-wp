/**
 * PDFMetricTileTable component for @react-pdf/renderer.
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
import { View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFCard from './PDFCard';
import PDFLink from './PDFLink';
import PDFTypography from './PDFTypography';

const styles = createPDFStyles( {
	// Matches the dashboard tile's `min-height: 150px`, and fills the grid cell so
	// every tile in a row shares the tallest tile's height.
	card: {
		minHeight: 150,
		flexGrow: 1,
	},
	// 12px / 400 / on-surface-variant, matching the dashboard tile heading.
	title: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
	// The ranked list sits 12px below the heading, as on the dashboard.
	table: {
		flexDirection: 'column',
		marginTop: 12,
	},
	// One entry: the label on the left, its metric on the right. The rows need no
	// padding of their own; the 1.33 line height spaces them as the design does.
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	// The metric hugs the right edge and is never truncated.
	metric: {
		flexShrink: 0,
	},
} );

/** One ranked entry: a primary label and its formatted metric. */
export interface PDFMetricTileTableRow {
	/** The primary label, e.g. a page title, city, or author name. */
	primary: string;
	/** The pre-formatted metric, e.g. "1.2K" or "34%". */
	metric: string;
	/** The destination the primary label links to, matching the dashboard row. Empty or omitted renders the label as plain text. */
	primaryURL?: string;
}

export interface PDFMetricTileTableProps {
	/** The tile heading, e.g. "Top cities". */
	title: string;
	/** The ranked entries, in the dashboard tile's order. */
	rows: PDFMetricTileTableRow[];
	/** The maximum number of rows to render. Defaults to every row. */
	limit?: number;
}

const PDFMetricTileTable: FC< PDFMetricTileTableProps > = ( {
	title,
	rows,
	limit,
} ) => {
	const visibleRows =
		typeof limit === 'number' ? rows.slice( 0, limit ) : rows;

	return (
		<PDFCard style={ styles.card }>
			<PDFTypography type="body" size="small" style={ styles.title }>
				{ title }
			</PDFTypography>
			<View style={ styles.table }>
				{ visibleRows.map( ( row, index ) => (
					<View key={ index } style={ styles.row }>
						<PDFLink
							href={ row.primaryURL }
							type="body"
							size="small"
							truncateContent
						>
							{ row.primary }
						</PDFLink>
						<PDFTypography
							type="body"
							size="small"
							style={ styles.metric }
						>
							{ row.metric }
						</PDFTypography>
					</View>
				) ) }
			</View>
		</PDFCard>
	);
};

export default PDFMetricTileTable;
