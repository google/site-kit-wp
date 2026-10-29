/**
 * Cities row for the Your visitor groups PDF audience card.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDFAudienceMetricIconCities } from '@/js/components/pdf-export/pdf-icons';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_TYPOGRAPHY } from '@/js/components/pdf-export/pdf-typography';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { numFmt } from '@/js/util';
import type { AudienceTileTopCity } from './buildPDFAudienceCard';
import PDFAudienceCardSection from './PDFAudienceCardSection';
import { audienceCardStyles } from './pdfAudienceCardStyles';
import PDFAudienceTileNoData from './PDFAudienceTileNoData';
import { getTruncationHyphenationCallback } from './pdfTextTruncation';

const styles = createPDFStyles( {
	citiesRow: {
		flexDirection: 'row',
		columnGap: 10,
		marginTop: 12,
	},
	city: {
		flex: 1,
		overflow: 'hidden',
	},
	cityName: {
		maxLines: 1,
		textOverflow: 'ellipsis',
	},
	cityPercentage: {
		marginTop: 2,
	},
} );

// Leaves room for the ellipsis.
const cityNameStyle: Style[] = [
	styles.cityName,
	{ paddingRight: PDF_TYPOGRAPHY.title.small.fontSize },
];

interface PDFAudienceCitiesRowProps {
	/** Up to three top cities. */
	topCities: AudienceTileTopCity[];
}

const PDFAudienceCitiesRow: FC< PDFAudienceCitiesRowProps > = ( {
	topCities,
} ) => {
	return (
		<PDFAudienceCardSection Icon={ PDFAudienceMetricIconCities }>
			<View style={ audienceCardStyles.body }>
				<PDFTypography
					size="medium"
					style={ audienceCardStyles.sectionTitle }
				>
					{ __( 'Cities with the most visitors', 'google-site-kit' ) }
				</PDFTypography>
				<View style={ styles.citiesRow }>
					{ ! topCities.length && <PDFAudienceTileNoData /> }
					{ topCities.map( ( city ) => (
						<View key={ city.name } style={ styles.city }>
							<PDFTypography
								type="title"
								size="small"
								style={ cityNameStyle }
								hyphenationCallback={ getTruncationHyphenationCallback(
									city.name
								) }
							>
								{ city.name }
							</PDFTypography>
							<PDFTypography
								size="medium"
								style={ styles.cityPercentage }
							>
								{ numFmt( city.percentage, {
									style: 'percent',
									maximumFractionDigits: 1,
								} ) }
							</PDFTypography>
						</View>
					) ) }
				</View>
			</View>
		</PDFAudienceCardSection>
	);
};

export default PDFAudienceCitiesRow;
