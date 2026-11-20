/**
 * Traffic Overview PDF notice.
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
import { Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/stylesheet';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { splitBoldSegments } from '@/js/modules/analytics-4/components/ai-insight/utils';

const styles = createPDFStyles( {
	notice: {
		backgroundColor: PDF_COLORS.SURFACES_BACKGROUND,
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	// The dashboard sets the names a generated insight highlights in the
	// medium weight, not in bold.
	highlight: {
		fontWeight: 500,
	},
} );

export interface TrafficOverviewNoticePDFProps {
	/** The notice's text. In a generated insight, `**` pairs mark the names it highlights. */
	text: string;
	/** Style merged on top of the notice's box. */
	style?: Style;
}

/**
 * Prints a notice of the Traffic Overview section: a generated insight, or a
 * notice that says why a part isn't there, on the gray of the dashboard's
 * notices. The names a generated insight highlights print in the medium
 * weight, as on the dashboard, and no other markup is read.
 *
 * @since n.e.x.t
 *
 * @param {Object} props         Component props.
 * @param {string} props.text    The notice's text.
 * @param {Object} [props.style] Optional. Style merged on top of the notice's box.
 * @return {Element} The notice.
 */
const TrafficOverviewNoticePDF: FC< TrafficOverviewNoticePDFProps > = ( {
	text,
	style,
} ) => (
	<View style={ style ? [ styles.notice, style ] : styles.notice }>
		<PDFTypography size="medium">
			{ splitBoldSegments( text ).map( ( segment, index ) =>
				segment.isBold ? (
					<Text key={ index } style={ styles.highlight }>
						{ segment.text }
					</Text>
				) : (
					segment.text
				)
			) }
		</PDFTypography>
	</View>
);

export default TrafficOverviewNoticePDF;
