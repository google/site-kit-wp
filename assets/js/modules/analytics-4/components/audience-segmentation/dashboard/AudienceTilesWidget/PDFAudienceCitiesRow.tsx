/**
 * Cities section of an audience card in the Your visitor groups PDF widget.
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
import { PDFAudienceMetricIconCities } from '@/js/components/pdf-export/pdf-icons';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { numFmt } from '@/js/util';
import type { AudienceTileTopCity } from './buildPDFAudienceCard';
import PDFAudienceCardSection from './PDFAudienceCardSection';
import { audienceCardStyles } from './pdfAudienceCardStyles';
import PDFAudienceTileNoData from './PDFAudienceTileNoData';

const styles = createPDFStyles( {
	// The cities sit 10px apart, like the dashboard tile.
	citiesRow: {
		flexDirection: 'row',
		columnGap: 10,
		marginTop: 12,
	},
	// A name too long to truncate, such as one whose first word alone overflows,
	// is clipped at the city's edge rather than drawn over the next city.
	city: {
		flex: 1,
		overflow: 'hidden',
	},
	// A long city name truncates to one line with an ellipsis. `@react-pdf`
	// wraps text by default, so `maxLines` caps it at one line. It draws the
	// ellipsis after the last character that fits, so the padding keeps room
	// for the ellipsis, about 10.4px wide at this size, inside the city.
	cityName: {
		maxLines: 1,
		textOverflow: 'ellipsis',
		paddingRight: 11,
	},
	cityPercentage: {
		marginTop: 2,
	},
} );

/**
 * Splits a word into its characters, with an empty part between each pair.
 *
 * `@react-pdf` truncates only text that wraps, and wraps only at the parts a
 * word splits into. It breaks at an empty part without adding a hyphen, so a
 * city name with no space, such as "Vacoas-Phoenix", wraps between any two
 * characters and then truncates with an ellipsis.
 *
 * @since n.e.x.t
 *
 * @param word The word to split.
 * @return The word's characters, with an empty part between each pair.
 */
function splitIntoCharacters( word: string ): string[] {
	return Array.from( word ).flatMap( ( character, index ) =>
		index ? [ '', character ] : [ character ]
	);
}

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
					{ /* If no city exists, show a "no data" message. */ }
					{ ! topCities.length && <PDFAudienceTileNoData /> }
					{ topCities.map( ( city ) => (
						<View key={ city.name } style={ styles.city }>
							{ /*
							 * A name with a space keeps wrapping at its spaces:
							 * `@react-pdf` closes up the spaces on a line it
							 * breaks between characters.
							 */ }
							<PDFTypography
								type="title"
								size="small"
								style={ styles.cityName }
								hyphenationCallback={
									city.name.includes( ' ' )
										? undefined
										: splitIntoCharacters
								}
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
