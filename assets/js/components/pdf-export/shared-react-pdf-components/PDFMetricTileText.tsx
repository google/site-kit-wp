/**
 * PDFMetricTileText component for @react-pdf/renderer.
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
import PDFChangeBadge from './PDFChangeBadge';
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
	// The primary text value, e.g. "Organic Search", 4px below the title. Unlike
	// the numeric tile this is a text label, so it uses the title type rather than
	// the large headline value.
	value: {
		marginTop: 4,
	},
	// 14px / on-surface, e.g. "of 1,234 total visitors".
	subtext: {
		marginTop: 2,
	},
	// The badge is a pill, so a row wrapper keeps it hugging its content instead
	// of stretching to the card width. It sits 12px below the sub-text.
	badgeRow: {
		flexDirection: 'row',
		marginTop: 12,
	},
} );

export interface PDFMetricTileTextProps {
	/** The tile heading, e.g. "Top traffic source". */
	title: string;
	/** The primary text value, e.g. "Organic Search". */
	value: string;
	/** Optional caption below the value, e.g. "3.4K visitors". */
	subtext?: string;
	/** Pre-formatted, signed change for the badge, e.g. "+5.1%". Hides the badge when omitted. */
	change?: string;
	/** Whether the change is negative, controlling the badge color. */
	isNegative?: boolean;
}

/**
 * Mirrors the dashboard's `MetricTileText`: it shares the full-card layout of
 * `PDFNumericMetricTile`, but its value is a text label (e.g. a traffic source
 * name) rather than a large formatted number.
 */
const PDFMetricTileText: FC< PDFMetricTileTextProps > = ( {
	title,
	value,
	subtext,
	change,
	isNegative = false,
} ) => {
	return (
		<PDFCard style={ styles.card }>
			<PDFTypography type="body" size="small" style={ styles.title }>
				{ title }
			</PDFTypography>
			<PDFTypography type="title" size="medium" style={ styles.value }>
				{ value }
			</PDFTypography>
			{ !! subtext && (
				<PDFTypography style={ styles.subtext }>
					{ subtext }
				</PDFTypography>
			) }
			{ !! change && (
				<View style={ styles.badgeRow }>
					<PDFChangeBadge
						change={ change }
						isNegative={ isNegative }
					/>
				</View>
			) }
		</PDFCard>
	);
};

export default PDFMetricTileText;
