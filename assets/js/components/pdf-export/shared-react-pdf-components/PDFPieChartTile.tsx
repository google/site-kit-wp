/**
 * PDFPieChartTile component for @react-pdf/renderer.
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
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDF_FONT_FAMILY_TEXT } from '@/js/components/pdf-export/pdf-theme';

const COLORS = {
	title: '#161b18',
	label: '#161b18',
	value: '#161b18',
	noData: '#646464',
};

const tileStyles = StyleSheet.create( {
	title: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 7,
		fontWeight: 500,
		letterSpacing: -0.05,
		lineHeight: 1.143,
		color: COLORS.title,
		marginBottom: 12,
	},
	body: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	legend: {
		flexDirection: 'column',
		flexGrow: 1,
		flexShrink: 1,
		marginRight: 12,
	},
	legendRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	swatch: {
		width: 6,
		height: 6,
		borderRadius: 3,
		marginRight: 8,
	},
	label: {
		flexGrow: 1,
		flexShrink: 1,
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 6,
		letterSpacing: 0.1,
		lineHeight: 1.333,
		color: COLORS.label,
	},
	percentage: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 6,
		fontWeight: 500,
		letterSpacing: 0.1,
		lineHeight: 1.333,
		color: COLORS.value,
		marginLeft: 8,
		textAlign: 'right',
	},
	chart: {
		width: 72.85,
		height: 72.85,
	},
	noData: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 6,
		color: COLORS.noData,
	},
} );

export interface PDFPieChartTileRow {
	/** Segment label, e.g. "Organic Search". */
	label: string;
	/** Pre-formatted percentage shown on the right, e.g. "79.2%". */
	percentage: string;
	/** Swatch color, matching this row's donut segment. */
	color: string;
}

export interface PDFPieChartTileProps {
	/** Tile heading, e.g. "Visitors by channels". */
	title: string;
	/** Ordered legend rows, in the same order as the donut segments. */
	rows: PDFPieChartTileRow[];
	/** Donut chart JPEG data URI. Shows the placeholder when nullish. */
	chartImage?: string;
}

const PDFPieChartTile: FC< PDFPieChartTileProps > = ( {
	title,
	rows,
	chartImage,
} ) => {
	return (
		<View>
			<Text style={ tileStyles.title }>{ title }</Text>
			{ chartImage ? (
				<View style={ tileStyles.body }>
					<View style={ tileStyles.legend }>
						{ rows.map( ( { label, percentage, color } ) => (
							<View key={ label } style={ tileStyles.legendRow }>
								<View
									style={ {
										...tileStyles.swatch,
										backgroundColor: color,
									} }
								/>
								<Text style={ tileStyles.label }>{ label }</Text>
								<Text style={ tileStyles.percentage }>
									{ percentage }
								</Text>
							</View>
						) ) }
					</View>
					<Image src={ chartImage } style={ tileStyles.chart } />
				</View>
			) : (
				<Text style={ tileStyles.noData }>
					{ __( 'Data unavailable', 'google-site-kit' ) }
				</Text>
			) }
		</View>
	);
};

export default PDFPieChartTile;
