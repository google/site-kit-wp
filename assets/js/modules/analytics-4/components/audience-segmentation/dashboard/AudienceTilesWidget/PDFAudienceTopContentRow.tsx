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
import PDFPartialDataBadge, {
	PDF_PARTIAL_DATA_BADGE_HEIGHT,
} from '@/js/components/pdf-export/shared-react-pdf-components/PDFPartialDataBadge';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { numFmt } from '@/js/util';
import type { AudienceTileTopContent } from './buildPDFAudienceCard';
import PDFAudienceCardSection from './PDFAudienceCardSection';
import { audienceCardStyles } from './pdfAudienceCardStyles';
import PDFAudienceTileNoData from './PDFAudienceTileNoData';
import { getTruncationHyphenationCallback } from './pdfTextTruncation';

const styles = createPDFStyles( {
	titleRow: {
		minHeight: PDF_PARTIAL_DATA_BADGE_HEIGHT,
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
	// `@react-pdf` wraps text by default, so `maxLines` keeps it to one line.
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
					<View style={ audienceCardStyles.badgeRowTitle }>
						<PDFTypography
							size="medium"
							style={ audienceCardStyles.sectionTitle }
						>
							{ __(
								'Top content by pageviews',
								'google-site-kit'
							) }
						</PDFTypography>
					</View>
					{ isTopContentPartialData && <PDFPartialDataBadge /> }
				</View>
				{ ! topContent.length && <PDFAudienceTileNoData /> }
				{ /* Links to the Analytics report; `PDFLink` falls back to plain text. */ }
				{ topContent.map( ( content, index ) => (
					<View
						key={ `${ content.title }-${ index }` }
						style={ styles.contentRow }
					>
						<View style={ styles.contentTitle }>
							<PDFLink
								href={ content.serviceURL }
								size="small"
								style={ styles.contentTitleText }
								hyphenationCallback={ getTruncationHyphenationCallback(
									content.title
								) }
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
