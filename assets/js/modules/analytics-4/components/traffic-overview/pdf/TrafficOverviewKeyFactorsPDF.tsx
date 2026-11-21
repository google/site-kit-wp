/**
 * Traffic Overview PDF key factors section.
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
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { TrafficOverviewTypicalTrafficPDFData } from './getTypicalTrafficPDFData';
import TrafficOverviewKeyFactorCardPDF from './TrafficOverviewKeyFactorCardPDF';
import TrafficOverviewNoticePDF from './TrafficOverviewNoticePDF';

const styles = createPDFStyles( {
	section: {
		marginTop: 24,
	},
	heading: {
		marginBottom: 12,
	},
	block: {
		marginBottom: 12,
	},
	cards: {
		flexDirection: 'row',
		alignItems: 'stretch',
		gap: 24,
	},
} );

export type TrafficOverviewKeyFactorsPDFProps = Pick<
	TrafficOverviewTypicalTrafficPDFData,
	'daysInRange' | 'driver' | 'keyFactorsNotice' | 'keyFactors'
>;

/**
 * Prints the key factors section, in the order the dashboard shows it: the
 * heading, the notice, the generated summary, then the cards.
 *
 * @since n.e.x.t
 *
 * @param {Object}        props                  Component props.
 * @param {number}        props.daysInRange      The number of days in the date range, which the heading names.
 * @param {string|null}   props.driver           The generated summary of the key factors, or null.
 * @param {string|null}   props.keyFactorsNotice The notice under the heading, or null.
 * @param {Array<Object>} props.keyFactors       The cards, in the order to print them.
 * @return {Element} The section.
 */
const TrafficOverviewKeyFactorsPDF: FC<
	TrafficOverviewKeyFactorsPDFProps
> = ( { daysInRange, driver, keyFactorsNotice, keyFactors } ) => (
	<View style={ styles.section }>
		<PDFTypography type="title" size="medium" style={ styles.heading }>
			{ sprintf(
				/* translators: %d: the number of days in the selected date range, such as "28" */
				_n(
					'Biggest traffic shifts vs. the previous %d day',
					'Biggest traffic shifts vs. the previous %d days',
					daysInRange,
					'google-site-kit'
				),
				daysInRange
			) }
		</PDFTypography>
		{ !! keyFactorsNotice && (
			<TrafficOverviewNoticePDF
				text={ keyFactorsNotice }
				style={ styles.block }
			/>
		) }
		{ !! driver && (
			<TrafficOverviewNoticePDF text={ driver } style={ styles.block } />
		) }
		{ keyFactors.length > 0 && (
			<View style={ styles.cards }>
				{ keyFactors.map( ( keyFactor, index ) => (
					// Keyed by position: nothing here reorders, and two kinds
					// of driver can share a name.
					<TrafficOverviewKeyFactorCardPDF
						key={ index }
						{ ...keyFactor }
					/>
				) ) }
			</View>
		) }
	</View>
);

export default TrafficOverviewKeyFactorsPDF;
