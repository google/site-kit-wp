/**
 * PDFTableSection: a heading, a card, and a table (or empty state) for a PDF widget.
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
import { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import PDFNoData from './PDFNoData';
import PDFTable, { PDFTableColumn } from './PDFTable';
import PDFWidgetSection from './PDFWidgetSection';

export interface PDFTableSectionProps< Row > {
	/** Heading rendered above the card. */
	heading?: string;
	/** Column definitions passed to the table. */
	columns: Array< PDFTableColumn< Row > >;
	/** The rows of data. The section shows the empty state when this is empty. */
	rows: Row[];
	/** Horizontal gap in points (pt) between the cells of a row. When unset, the table uses its default gap. */
	columnGap?: number;
}

// `FC` can't take the generic `Row` type, so PDFTableSection is a function
// declaration instead of an `FC< Props >` component.
export default function PDFTableSection< Row >( {
	heading,
	columns,
	rows,
	columnGap,
}: PDFTableSectionProps< Row > ): ReactElement {
	const hasRows = rows.length > 0;

	// When the table has rows, the card drops its horizontal padding, so the
	// table fills the width. When there are no rows, the card adds padding
	// around the empty-state text.
	const cardStyle = {
		paddingVertical: scalePDFValue( 16 ),
		paddingHorizontal: hasRows ? 0 : scalePDFValue( 24 ),
	};

	return (
		<PDFWidgetSection heading={ heading } cardStyle={ cardStyle }>
			{ hasRows ? (
				<PDFTable
					columns={ columns }
					rows={ rows }
					columnGap={ columnGap }
				/>
			) : (
				<PDFNoData />
			) }
		</PDFWidgetSection>
	);
}
