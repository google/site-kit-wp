/**
 * Site Goals section PDF component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import {
	AGGREGATED_GROUP_ID,
	SiteGoalsPDFGroup,
} from './shapeSiteGoalsPDFData';
import SiteGoalsBreakdownGroupPDF from './SiteGoalsBreakdownGroupPDF';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
	groups: {
		gap: 20,
	},
	card: {
		paddingVertical: 24,
	},
} );

export interface SiteGoalsSectionPDFProps {
	/** The Site Goals PDF section heading, such as "Online store performance". */
	heading: string;
	/** The breakdown groups the Site Goals PDF section renders, one card each. */
	groups: SiteGoalsPDFGroup[];
	/** The title of the Key action rate tile in every card, such as "Sales rate". */
	rateLabel: string;
	/** The title of the Key action total tile in every card, such as "Total sales". */
	totalLabel: string;
	/** The caption under every Key action total, such as "“purchase” events". */
	totalSubtitle: string;
	/** The number of days in the PDF report's date range, for the "Vs. prev. 28 days" caption. */
	dateRangeLength: number;
}

const SiteGoalsSectionPDF: FC< SiteGoalsSectionPDFProps > = ( {
	heading,
	groups,
	rateLabel,
	totalLabel,
	totalSubtitle,
	dateRangeLength,
} ) => {
	// With no card the section would print its heading with nothing under it,
	// so it renders nothing at all.
	if ( groups.length === 0 ) {
		return null;
	}

	const comparisonLabel = sprintf(
		/* translators: %d: number of days in the comparison period, e.g. 28. */
		__( 'Vs. prev. %d days', 'google-site-kit' ),
		dateRangeLength
	);

	return (
		<View>
			<PDFTypography size="large" style={ styles.heading }>
				{ heading }
			</PDFTypography>
			<View style={ styles.groups }>
				{ groups.map( ( group ) => (
					<PDFCard key={ group.id } style={ styles.card }>
						<SiteGoalsBreakdownGroupPDF
							group={ group }
							rateLabel={ rateLabel }
							totalLabel={ totalLabel }
							totalSubtitle={ totalSubtitle }
							comparisonLabel={ comparisonLabel }
							showLabel={ group.id !== AGGREGATED_GROUP_ID }
						/>
					</PDFCard>
				) ) }
			</View>
		</View>
	);
};

export default SiteGoalsSectionPDF;
