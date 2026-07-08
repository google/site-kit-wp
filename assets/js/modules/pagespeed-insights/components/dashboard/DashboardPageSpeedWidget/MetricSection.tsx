/**
 * DashboardPageSpeedWidget PDF MetricSection component.
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
import { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { STRATEGY_COLUMN_WIDTH } from './MetricValueCell';

const styles = createPDFStyles( {
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: 24,
		padding: 24,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
	headerTitleCell: {
		flex: 1,
	},
	headerStrategyCell: {
		width: STRATEGY_COLUMN_WIDTH,
		alignItems: 'flex-start',
	},
	list: {
		paddingHorizontal: 24,
		paddingBottom: 16,
	},
} );

interface MetricSectionProps {
	/** The section's name in the header row, like "Lab data". */
	title: string;
	children: ReactNode;
}

export default function MetricSection( {
	title,
	children,
}: MetricSectionProps ) {
	return (
		<Fragment>
			<View style={ styles.headerRow }>
				<View style={ styles.headerTitleCell }>
					<PDFTypography type="title" size="small">
						{ title }
					</PDFTypography>
				</View>
				<View style={ styles.headerStrategyCell }>
					<PDFTypography type="title" size="small">
						{ __( 'Mobile', 'google-site-kit' ) }
					</PDFTypography>
				</View>
				<View style={ styles.headerStrategyCell }>
					<PDFTypography type="title" size="small">
						{ __( 'Desktop', 'google-site-kit' ) }
					</PDFTypography>
				</View>
			</View>
			<View style={ styles.list }>{ children }</View>
		</Fragment>
	);
}
