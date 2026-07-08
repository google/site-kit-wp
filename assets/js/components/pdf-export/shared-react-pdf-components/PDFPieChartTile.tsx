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
import { Image, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFTypography from './PDFTypography';

const tileStyles = createPDFStyles( {
	title: {
		marginBottom: 16,
	},
	body: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	legend: {
		flexDirection: 'column',
		width: 184,
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
	},
	percentage: {
		marginLeft: 6,
		textAlign: 'right',
	},
	chart: {
		width: 145.7,
		height: 145.7,
		marginRight: 24,
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
	/** The donut chart as a JPEG data URI. When it's not set, the tile returns null. */
	chartImage?: string;
}

const PDFPieChartTile: FC< PDFPieChartTileProps > = ( {
	title,
	rows,
	chartImage,
} ) => {
	// Without a donut image the tile returns null, and no placeholder takes
	// its place.
	if ( ! chartImage ) {
		return null;
	}

	return (
		<View>
			<PDFTypography type="title" size="small" style={ tileStyles.title }>
				{ title }
			</PDFTypography>
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
							<PDFTypography
								size="small"
								style={ tileStyles.label }
							>
								{ label }
							</PDFTypography>
							<PDFTypography
								type="label"
								size="small"
								style={ tileStyles.percentage }
							>
								{ percentage }
							</PDFTypography>
						</View>
					) ) }
				</View>
				<Image src={ chartImage } style={ tileStyles.chart } />
			</View>
		</View>
	);
};

export default PDFPieChartTile;
