/**
 * PDFTable: shared @react-pdf/renderer table primitive.
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

/*
 * TODO(#12547): The base PDFTable primitive (the header row, per-column
 * widths, the `format` cell path, the empty-state placeholder, and the colour
 * and typography tokens) is introduced by #12547, which moves the tokens into a
 * shared `pdf-theme.ts`. This file is added here so the Top content over time
 * PDF widget (#12548) can render and be tested before #12547 lands. When
 * #12547 merges, reconcile the base table with its canonical version and keep
 * the additive `cell` column callback below, which is #12548's change.
 */

/**
 * External dependencies
 */
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/*
 * TODO(#12547): Replace these inline tokens with the shared `pdf-theme.ts`
 * tokens that #12547 introduces. The values mirror the existing PDF components
 * (see `PDFMetricTile` and `DashboardReport`) so the table reads the same.
 */
const COLORS = {
	text: '#212121',
	secondary: '#646464',
	headerBackground: '#f8f9fa',
	divider: '#dadce0',
};

const styles = StyleSheet.create( {
	headerRow: {
		flexDirection: 'row',
		backgroundColor: COLORS.headerBackground,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.divider,
	},
	row: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: COLORS.divider,
	},
	cell: {
		paddingVertical: 6,
		paddingHorizontal: 8,
	},
	headerText: {
		fontSize: 9,
		fontWeight: 'bold',
		color: COLORS.secondary,
	},
	bodyText: {
		fontSize: 9,
		color: COLORS.text,
	},
	noData: {
		fontSize: 9,
		color: COLORS.secondary,
		paddingVertical: 6,
		paddingHorizontal: 8,
	},
} );

export type PDFTableRow = Record< string, unknown >;

export interface PDFTableColumn {
	/** Column heading rendered in the header row. */
	title: string;
	/** Row key whose value fills the body cell. Optional when `cell` is set. */
	key?: string;
	/** Cell width, such as `'40%'` or a point value. Defaults to an equal share. */
	width?: number | string;
	/** Horizontal text alignment for the header and body cells. Defaults to left. */
	align?: 'left' | 'right' | 'center';
	/** Formats the raw `key` value into the string shown in the body cell. */
	format?: ( value: unknown, row: PDFTableRow ) => string;
	/**
	 * Renders custom cell content for this column instead of the `format`-driven
	 * `<Text>`. Use it when a cell needs more than a single line of text, such as
	 * a title stacked above a URL. Added in #12548.
	 */
	cell?: ( row: PDFTableRow ) => ReactNode;
}

export interface PDFTableProps {
	/** Column definitions in render order. */
	columns: PDFTableColumn[];
	/** Row records mapped to body cells through each column's `key`, `format`, or `cell`. */
	rows: PDFTableRow[];
	/** Text shown when `rows` is empty. */
	emptyMessage?: string;
}

function columnStyle( column: PDFTableColumn ) {
	return [
		styles.cell,
		column.width !== undefined
			? { width: column.width }
			: { flex: 1, flexBasis: 0 },
	];
}

function columnTextAlign( column: PDFTableColumn ) {
	return { textAlign: column.align ?? 'left' };
}

const PDFTable: FC< PDFTableProps > = ( {
	columns,
	rows,
	emptyMessage = __( 'No data available', 'google-site-kit' ),
} ) => {
	return (
		<View>
			<View style={ styles.headerRow }>
				{ columns.map( ( column, index ) => (
					<View key={ index } style={ columnStyle( column ) }>
						<Text
							style={ [
								styles.headerText,
								columnTextAlign( column ),
							] }
						>
							{ column.title }
						</Text>
					</View>
				) ) }
			</View>
			{ rows.length === 0 ? (
				<Text style={ styles.noData }>{ emptyMessage }</Text>
			) : (
				rows.map( ( row, rowIndex ) => (
					<View key={ rowIndex } style={ styles.row }>
						{ columns.map( ( column, columnIndex ) => {
							const value =
								column.key !== undefined
									? row[ column.key ]
									: undefined;

							return (
								<View
									key={ columnIndex }
									style={ columnStyle( column ) }
								>
									{ column.cell ? (
										column.cell( row )
									) : (
										<Text
											style={ [
												styles.bodyText,
												columnTextAlign( column ),
											] }
										>
											{ column.format
												? column.format( value, row )
												: String( value ?? '' ) }
										</Text>
									) }
								</View>
							);
						} ) }
					</View>
				) )
			) }
		</View>
	);
};

export default PDFTable;
