/**
 * Metric row for the Your visitor groups PDF audience card.
 *
 * `PDFYourVisitorGroupsTile` renders one row per audience metric.
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
import PDFChangeBadge from '@/js/components/pdf-export/shared-react-pdf-components/PDFChangeBadge';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFIcon } from '@/js/components/pdf-export/types';
import { calculateChange, numFmt } from '@/js/util';
import type { AudienceTileMetric } from './buildPDFAudienceCard';

const styles = createPDFStyles( {
	// Each metric row is inset from the card edges and draws a divider below it.
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 24,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
	iconColumn: {
		width: 52,
		alignItems: 'center',
		marginRight: 4,
	},
	body: {
		flex: 1,
	},
	metricValue: {
		lineHeight: 32 / 28,
	},
	metricLabel: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
} );

/**
 * Builds the change chip's props from a metric's period-over-period change.
 *
 * The chip matches the dashboard's `ChangeBadge`. There's no chip when the
 * change can't be calculated. `signDisplay: 'exceptZero'` adds a leading
 * `+` or `-` sign to every non-zero change, based on the difference between
 * the current and previous values.
 *
 * @since 1.184.0
 *
 * @param metric The metric with its current and previous value.
 * @return Props for the change chip, or `null` to hide it.
 */
function getChangeChip(
	metric: AudienceTileMetric
): { change: string; isNegative: boolean } | null {
	const change = calculateChange( metric.previous, metric.current );

	if ( change === null ) {
		return null;
	}

	return {
		change: numFmt( change, {
			style: 'percent',
			signDisplay: 'exceptZero',
			maximumFractionDigits: 1,
		} ),
		isNegative: change < 0,
	};
}

interface PDFAudienceMetricRowProps {
	/** The metric's icon. */
	Icon: PDFIcon;
	/** The metric's label, shown below the value. */
	label: string;
	/** The pre-formatted metric value. For example, `'5%'`, not `0.05` or `5`. */
	value: string;
	/** The metric's current and previous value, for the change chip. */
	metric: AudienceTileMetric;
}

const PDFAudienceMetricRow: FC< PDFAudienceMetricRowProps > = ( {
	Icon,
	label,
	value,
	metric,
} ) => {
	const chip = getChangeChip( metric );

	return (
		<View style={ styles.row }>
			<View style={ styles.iconColumn }>
				<Icon />
			</View>
			<View style={ styles.body }>
				<PDFTypography
					type="headline"
					size="medium"
					style={ styles.metricValue }
				>
					{ value }
				</PDFTypography>
				<PDFTypography size="medium" style={ styles.metricLabel }>
					{ label }
				</PDFTypography>
			</View>
			{ chip && (
				<PDFChangeBadge
					change={ chip.change }
					isNegative={ chip.isNegative }
				/>
			) }
		</View>
	);
};

export default PDFAudienceMetricRow;
