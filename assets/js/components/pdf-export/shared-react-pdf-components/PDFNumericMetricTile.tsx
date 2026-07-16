/**
 * PDFNumericMetricTile component for @react-pdf/renderer.
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
	// 12px / 400 / on-surface-variant, matching the dashboard tile heading.
	title: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
	// 28px / line-height 36 / on-surface, the prominent metric value, 4px below
	// the title.
	value: {
		marginTop: 4,
	},
	// 14px / on-surface, e.g. "of 1,234 total visitors".
	subtext: {
		marginTop: 2,
	},
	// The badge is a pill, so a row wrapper keeps it hugging its content instead
	// of stretching to the card width. It sits 12px below the description.
	badgeRow: {
		flexDirection: 'row',
		marginTop: 12,
	},
} );

export interface PDFNumericMetricTileProps {
	/** The tile heading, e.g. "New visitors". */
	title: string;
	/** The pre-formatted prominent value, e.g. "12K". */
	value: string;
	/** Optional caption below the value, e.g. "of 1,234 total visitors". */
	subtext?: string;
	/** Pre-formatted, signed change for the badge, e.g. "+5.1%". Hides the badge when omitted. */
	change?: string;
	/** Whether the change is negative, controlling the badge color. */
	isNegative?: boolean;
}

/**
 * Renders a numeric metric tile as a white card: a heading, a large value, an
 * optional caption, and a change badge below.
 *
 * This mirrors the dashboard's numeric metric tile. Unlike the more compact
 * `PDFMetricTile` (card-less, with the value and badge on one row), this is the
 * full card tile the Key Metrics report grid uses, with a caption line under the
 * value and the badge stacked below.
 *
 * @since n.e.x.t
 *
 * @param props            Component props.
 * @param props.title      The tile heading.
 * @param props.value      The pre-formatted prominent value.
 * @param props.subtext    Optional caption below the value.
 * @param props.change     Pre-formatted, signed change for the badge.
 * @param props.isNegative Whether the change is negative.
 * @return The numeric metric tile.
 */
const PDFNumericMetricTile: FC< PDFNumericMetricTileProps > = ( {
	title,
	value,
	subtext,
	change,
	isNegative = false,
} ) => {
	return (
		<PDFCard>
			<PDFTypography type="body" size="small" style={ styles.title }>
				{ title }
			</PDFTypography>
			<PDFTypography type="headline" size="medium" style={ styles.value }>
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

export default PDFNumericMetricTile;
