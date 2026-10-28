/**
 * Header section of an audience card in the Your visitor groups PDF widget.
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
import PDFPartialDataBadge from '@/js/components/pdf-export/shared-react-pdf-components/PDFPartialDataBadge';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { audienceCardStyles } from './pdfAudienceCardStyles';

const styles = createPDFStyles( {
	// The dashboard tile gives the card no padding, so the header sets its own
	// inset and its bottom divider reaches both card edges. The header fills its
	// cell, so the divider lines up across the cards.
	header: {
		flexGrow: 1,
		paddingVertical: 25,
		paddingHorizontal: 25,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
} );

interface PDFAudienceCardHeaderProps {
	/** The audience display name. */
	audienceName: string;
	/** Whether to show the Partial data badge beside the audience name. */
	isAudiencePartialData: boolean;
}

const PDFAudienceCardHeader: FC< PDFAudienceCardHeaderProps > = ( {
	audienceName,
	isAudiencePartialData,
} ) => {
	return (
		<View style={ [ audienceCardStyles.badgeRow, styles.header ] }>
			<PDFTypography type="title" size="small">
				{ audienceName }
			</PDFTypography>
			{ isAudiencePartialData && <PDFPartialDataBadge /> }
		</View>
	);
};

export default PDFAudienceCardHeader;
