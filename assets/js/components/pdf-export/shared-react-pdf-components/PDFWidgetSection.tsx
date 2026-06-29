/**
 * PDFWidgetSection: widget heading + white card wrapper for the PDF report.
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
import type { Style } from '@react-pdf/stylesheet';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFCard from './PDFCard';
import PDFTypography from './PDFTypography';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
} );

export interface PDFWidgetSectionProps {
	/** Optional widget heading rendered on the page above the card. */
	heading?: string;
	/** Optional PDF outline bookmark rendered on the outer section wrapper. */
	bookmark?: string;
	/** Optional style merged onto the card. */
	cardStyle?: Style;
}

const PDFWidgetSection: FC< PDFWidgetSectionProps > = ( {
	heading,
	bookmark,
	cardStyle,
	children,
} ) => {
	return (
		<View { ...{ bookmark } }>
			{ !! heading && (
				<PDFTypography size="large" style={ styles.heading }>
					{ heading }
				</PDFTypography>
			) }
			<PDFCard style={ cardStyle }>{ children }</PDFCard>
		</View>
	);
};

export default PDFWidgetSection;
