/**
 * PDFMetricTile component for @react-pdf/renderer.
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
import PDFChangeBadge from './PDFChangeBadge';
import PDFTypography from './PDFTypography';

const tileStyles = createPDFStyles( {
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	metric: {
		flexDirection: 'column',
	},
	title: {
		marginBottom: 1,
	},
	aside: {
		flexDirection: 'column',
		alignItems: 'flex-end',
	},
	changeLabel: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
		marginTop: 4,
	},
} );

export interface PDFMetricTileProps {
	/** Heading rendered above the metric value, e.g. "All visitors". */
	title: string;
	/** Pre-formatted metric value to display prominently, e.g. "32.6K". */
	value: string;
	/** Pre-formatted, signed change string for the badge, e.g. "+5.1%". Hides the badge when omitted. */
	change?: string;
	/** Whether the change is negative. Controls the badge color. */
	isNegative?: boolean;
	/** Optional caption rendered below the badge, e.g. "Vs. prev. 28 days". */
	changeLabel?: string;
}

const PDFMetricTile: FC< PDFMetricTileProps > = ( {
	title,
	value,
	change,
	isNegative = false,
	changeLabel,
} ) => {
	return (
		<View style={ tileStyles.container }>
			<View style={ tileStyles.metric }>
				<PDFTypography
					type="title"
					size="small"
					style={ tileStyles.title }
				>
					{ title }
				</PDFTypography>
				<PDFTypography type="headline">{ value }</PDFTypography>
			</View>
			<View style={ tileStyles.aside }>
				{ !! change && (
					<PDFChangeBadge
						change={ change }
						isNegative={ isNegative }
					/>
				) }
				{ !! changeLabel && (
					<PDFTypography
						size="small"
						style={ tileStyles.changeLabel }
					>
						{ changeLabel }
					</PDFTypography>
				) }
			</View>
		</View>
	);
};

export default PDFMetricTile;
