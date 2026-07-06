/**
 * PDFTable: shared table for PDF report widgets (@react-pdf/renderer).
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
import { ReactElement, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import {
	createPDFStyles,
	scalePDFValue,
} from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTypography from './PDFTypography';

const ROW_PADDING_HORIZONTAL = 24;
const DEFAULT_COLUMN_GAP = 40;

const styles = createPDFStyles( {
	headerRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
		paddingBottom: 16,
		paddingHorizontal: ROW_PADDING_HORIZONTAL,
	},
	bodyRow: {
		paddingHorizontal: ROW_PADDING_HORIZONTAL,
	},
	bodyRowContent: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
		paddingVertical: 8,
	},
	bodyRowContentLast: {
		borderBottomWidth: 0,
	},
	rightAlign: {
		textAlign: 'right',
	},
} );

export interface PDFTableColumn< Row > {
	/** Column heading rendered in the header row. */
	header: string;
	/** Cell width, such as `'40%'` or a point value. Defaults to an equal share of the row. */
	width?: number | string;
	/** Text alignment for the header and cells. Defaults to left. */
	align?: 'left' | 'right';
	/** Renders custom cell content, used instead of format when a column sets both. */
	cell?: ( row: Row ) => ReactNode;
	/** Returns the cell text, which the table renders as a single line of `<Text>`. */
	format?: ( row: Row ) => string;
}

export interface PDFTableProps< Row > {
	/** Column definitions in the order they appear. */
	columns: Array< PDFTableColumn< Row > >;
	/** The rows of data. Each row renders one cell per column, from the column's `cell` or `format`. */
	rows: Row[];
	/** Horizontal gap between the cells of a row, in Figma frame pixels. `scalePDFValue` converts it to points. Defaults to 40. */
	columnGap?: number;
}

/**
 * Builds the style for one column cell.
 *
 * Returns a fixed width when the column sets one, or an equal share of the row
 * when it does not.
 *
 * @since 1.182.0
 *
 * @param column Column definition for the cell.
 * @return The width or flex style for the cell.
 */
function getCellStyle< Row >( column: PDFTableColumn< Row > ) {
	return column.width !== undefined ? { width: column.width } : { flex: 1 };
}

// `FC` can't take the generic `Row` type, so PDFTable is a function declaration
// instead of an `FC< Props >` component.
export default function PDFTable< Row >( {
	columns,
	rows,
	columnGap = DEFAULT_COLUMN_GAP,
}: PDFTableProps< Row > ): ReactElement {
	const scaledColumnGap = scalePDFValue( columnGap );

	return (
		<View>
			<View
				style={ [ styles.headerRow, { columnGap: scaledColumnGap } ] }
			>
				{ columns.map( ( column, columnIndex ) => (
					<View key={ columnIndex } style={ getCellStyle( column ) }>
						<PDFTypography
							type="title"
							size="small"
							style={
								column.align === 'right'
									? styles.rightAlign
									: undefined
							}
						>
							{ column.header }
						</PDFTypography>
					</View>
				) ) }
			</View>
			{ rows.map( ( row, rowIndex ) => {
				const isLastRow = rowIndex === rows.length - 1;

				return (
					<View key={ rowIndex } style={ styles.bodyRow }>
						<View
							style={
								isLastRow
									? [
											styles.bodyRowContent,
											{ columnGap: scaledColumnGap },
											styles.bodyRowContentLast,
									  ]
									: [
											styles.bodyRowContent,
											{ columnGap: scaledColumnGap },
									  ]
							}
						>
							{ columns.map( ( column, columnIndex ) => (
								<View
									key={ columnIndex }
									style={ getCellStyle( column ) }
								>
									{ column.cell ? (
										column.cell( row )
									) : (
										<PDFTypography
											style={
												column.align === 'right'
													? styles.rightAlign
													: undefined
											}
										>
											{ column.format
												? column.format( row )
												: '' }
										</PDFTypography>
									) }
								</View>
							) ) }
						</View>
					</View>
				);
			} ) }
		</View>
	);
}
