/**
 * DashboardAllTrafficWidgetGA4 PDF component for @react-pdf/renderer.
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
import { StyleSheet, Text, View } from '@react-pdf/renderer';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PDFMetricTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTile';
import PDFWidgetSection from '@/js/components/pdf-export/shared-react-pdf-components/PDFWidgetSection';
import type { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { calculateChange, numFmt } from '@/js/util';
import type { AllTrafficPDFData } from './getPDFData';

const styles = StyleSheet.create( {
	chartPlaceholder: {
		width: '100%',
		height: 64,
		backgroundColor: '#ebeef0',
		borderRadius: 8,
		marginTop: 16,
	},
	noData: {
		fontSize: 9,
		color: '#646464',
	},
} );

export default function DashboardAllTrafficWidgetGA4PDF( {
	data,
}: PDFWidgetComponentProps ) {
	const trafficData = data as AllTrafficPDFData[ 'data' ];

	if ( ! trafficData ) {
		return (
			<PDFWidgetSection
				heading={ __(
					'Your site traffic over time',
					'google-site-kit'
				) }
			>
				<Text style={ styles.noData }>
					{ __( 'No data available.', 'google-site-kit' ) }
				</Text>
			</PDFWidgetSection>
		);
	}

	const { totalsReport, graphReport } = trafficData;
	const [ current, previous ] = totalsReport?.totals || [];
	const currentValue = Number( current?.metricValues?.[ 0 ]?.value );
	const previousValue = Number( previous?.metricValues?.[ 0 ]?.value );

	const change = calculateChange( previousValue, currentValue );
	const changeText =
		typeof change === 'number'
			? numFmt( change, {
					style: 'percent',
					signDisplay: 'exceptZero',
					maximumFractionDigits: 1,
			  } )
			: undefined;

	const graphRowCount = graphReport?.rows?.length || 0;
	const comparisonLabel =
		graphRowCount > 0
			? sprintf(
					/* translators: %d: number of days in the comparison period */
					__( 'Vs. prev. %d days', 'google-site-kit' ),
					graphRowCount
			  )
			: undefined;

	const formattedValue = numFmt( currentValue || 0 );

	return (
		<PDFWidgetSection
			heading={ __( 'Your site traffic over time', 'google-site-kit' ) }
		>
			<PDFMetricTile
				title={ __( 'All visitors', 'google-site-kit' ) }
				value={ formattedValue }
				change={ changeText }
				isNegative={ typeof change === 'number' && change < 0 }
				changeLabel={ comparisonLabel }
			/>
			<View style={ styles.chartPlaceholder } />
		</PDFWidgetSection>
	);
}
