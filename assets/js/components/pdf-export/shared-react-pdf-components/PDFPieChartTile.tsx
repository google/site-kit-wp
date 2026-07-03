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
import { Image, Text, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_FONT_FAMILY_TEXT } from '@/js/components/pdf-export/pdf-theme';

const COLORS = {
	title: '#161b18',
	label: '#161b18',
	value: '#161b18',
	noData: '#646464',
};

const tileStyles = createPDFStyles( {
	title: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 14,
		fontWeight: 500,
		letterSpacing: -0.1,
		lineHeight: 1.143,
		color: COLORS.title,
		marginBottom: 24,
	},
	body: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	legend: {
		flexDirection: 'column',
		width: 174,
	},
	legendRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 13,
	},
	swatch: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: 6,
	},
	label: {
		flexGrow: 1,
		flexShrink: 1,
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		letterSpacing: 0.2,
		lineHeight: 1.333,
		color: COLORS.label,
	},
	percentage: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		fontWeight: 500,
		letterSpacing: 0.2,
		lineHeight: 1.333,
		color: COLORS.value,
		marginLeft: 16,
		textAlign: 'right',
	},
	chart: {
		width: 145.7,
		height: 145.7,
		marginRight: 24,
	},
	noData: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		color: COLORS.noData,
	},
} );

export interface PDFPieChartTileRow {
	/** The donut segment's label, like "Organic Search". */
	label: string;
	/** The formatted percentage shown on the right, like "79.2%". */
	percentage: string;
	/** The swatch color, the same as this row's donut segment. */
	color: string;
}

export interface PDFPieChartTileProps {
	/** The tile heading, like "Visitors by channels". */
	title: string;
	/** The legend rows, in the same order as the donut segments. */
	rows: PDFPieChartTileRow[];
	/** The donut chart as a JPEG data URI. When it's not set, the tile shows the placeholder instead. */
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
								<Text style={ tileStyles.label }>
									{ label }
								</Text>
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
