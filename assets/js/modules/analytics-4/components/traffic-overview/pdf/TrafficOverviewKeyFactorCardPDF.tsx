/**
 * Traffic Overview PDF key factor card.
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
import { getPDFChangeType } from '@/js/components/pdf-export/getPDFTileChange';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import PDFChangeBadge from '@/js/components/pdf-export/shared-react-pdf-components/PDFChangeBadge';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import {
	formatVisitsChange,
	formatVisitsShare,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { TrafficOverviewPDFKeyFactor } from './getTypicalTrafficPDFData';

const styles = createPDFStyles( {
	card: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	share: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
		marginTop: 8,
	},
} );

/**
 * Prints a key factor card: its name and its change in visits, and on a
 * steady period its share of the site's visits, as the dashboard's card shows
 * them. The card leaves out the values inside the driver, which the dashboard
 * lists under the card.
 *
 * @since n.e.x.t
 *
 * @param {Object} props                  Component props.
 * @param {string} props.name             The card's name.
 * @param {number} props.change           The change in visits, negative for a drop.
 * @param {number} [props.visitsSharePct] Optional. The share of the site's visits, in percent, on a steady period.
 * @return {Element} The card.
 */
const TrafficOverviewKeyFactorCardPDF: FC< TrafficOverviewPDFKeyFactor > = ( {
	name,
	change,
	visitsSharePct,
} ) => (
	<PDFCard style={ styles.card }>
		<View style={ styles.header }>
			<PDFTypography type="title" size="small" truncateContent>
				{ name }
			</PDFTypography>
			{ /* The sign in the text gives the direction, so it never depends on the color alone. */ }
			<PDFChangeBadge
				change={ formatVisitsChange( change ) }
				changeType={ getPDFChangeType( change ) }
			/>
		</View>
		{ visitsSharePct !== undefined && (
			<PDFTypography size="small" style={ styles.share }>
				{ formatVisitsShare( visitsSharePct ) }
			</PDFTypography>
		) }
	</PDFCard>
);

export default TrafficOverviewKeyFactorCardPDF;
