/**
 * Top content section of an audience card in the Your visitor groups PDF widget.
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
import { PDFAudienceMetricIconTopContent } from '@/js/components/pdf-export/pdf-icons';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFLink from '@/js/components/pdf-export/shared-react-pdf-components/PDFLink';
import PDFPartialDataBadge from '@/js/components/pdf-export/shared-react-pdf-components/PDFPartialDataBadge';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { numFmt } from '@/js/util';
import type { AudienceTileTopContent } from './buildPDFAudienceCard';
import PDFAudienceCardSection from './PDFAudienceCardSection';
import { audienceCardStyles } from './pdfAudienceCardStyles';
import PDFAudienceTileNoData from './PDFAudienceTileNoData';

const styles = createPDFStyles( {
	titleRow: {
		marginBottom: 10,
	},
	contentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	// The title fills the row remainder before the pageviews count.
	contentTitle: {
		flex: 1,
		marginRight: 30,
	},
	// A long title truncates to one line with an ellipsis. `@react-pdf`
	// wraps text by default, so `maxLines` caps it at one line.
	contentTitleText: {
		maxLines: 1,
		textOverflow: 'ellipsis',
	},
} );

interface PDFAudienceTopContentRowProps {
	/** Up to three top content pages. */
	topContent: AudienceTileTopContent[];
	/** Whether to show the Partial data badge on the Top content title. */
	isTopContentPartialData: boolean;
}

const PDFAudienceTopContentRow: FC< PDFAudienceTopContentRowProps > = ( {
	topContent,
	isTopContentPartialData,
} ) => {
	return (
		<PDFAudienceCardSection Icon={ PDFAudienceMetricIconTopContent } isLast>
			<View style={ audienceCardStyles.body }>
				<View
					style={ [ audienceCardStyles.badgeRow, styles.titleRow ] }
				>
					<PDFTypography
						size="medium"
						style={ audienceCardStyles.sectionTitle }
					>
						{ __( 'Top content by pageviews', 'google-site-kit' ) }
					</PDFTypography>
					{ isTopContentPartialData && <PDFPartialDataBadge /> }
				</View>
				{ /* If no content exists, show a "no data" message. */ }
				{ ! topContent.length && <PDFAudienceTileNoData /> }
				{ /*
				 * The page title links to its Analytics report, like the
				 * dashboard tile. When the page has no link, `PDFLink`
				 * renders the title as plain text instead of as a link.
				 */ }
				{ topContent.map( ( content ) => (
					<View key={ content.title } style={ styles.contentRow }>
						<View style={ styles.contentTitle }>
							<PDFLink
								href={ content.serviceURL }
								size="small"
								style={ styles.contentTitleText }
							>
								{ content.title }
							</PDFLink>
						</View>
						<PDFTypography size="small">
							{ numFmt( content.pageviews ) }
						</PDFTypography>
					</View>
				) ) }
			</View>
		</PDFAudienceCardSection>
	);
};

export default PDFAudienceTopContentRow;
