/**
 * DashboardPageSpeedWidget PDF component for @react-pdf/renderer.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { SpeedPDFData } from './getPDFData';
import SpeedMetricSections from './SpeedMetricSections';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
} );

const DashboardPageSpeedWidgetPDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const speedData = data as SpeedPDFData[ 'data' ] | undefined;

	// Without data the widget returns null, and no placeholder takes its place.
	if ( ! speedData || ( ! speedData.mobile && ! speedData.desktop ) ) {
		return null;
	}

	return (
		<View>
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Your site performance', 'google-site-kit' ) }
			</PDFTypography>
			<SpeedMetricSections
				mobile={ speedData.mobile }
				desktop={ speedData.desktop }
			/>
		</View>
	);
};

export default DashboardPageSpeedWidgetPDF;
