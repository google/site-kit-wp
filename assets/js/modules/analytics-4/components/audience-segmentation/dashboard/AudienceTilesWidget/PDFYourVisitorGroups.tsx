/**
 * Your visitor groups PDF widget: the row of audience cards.
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
import { FC, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PDFAudienceMetricIconPagesPerVisit,
	PDFAudienceMetricIconPageviews,
	PDFAudienceMetricIconVisitors,
	PDFAudienceMetricIconVisitsPerVisitor,
} from '@/js/components/pdf-export/pdf-icons';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { numFmt } from '@/js/util';
import type { AudienceTilePDFData } from './buildPDFAudienceCard';
import type { AudienceTilesPDFData } from './getPDFData';
import PDFAudienceCardHeader from './PDFAudienceCardHeader';
import PDFAudienceCitiesRow from './PDFAudienceCitiesRow';
import PDFAudienceMetricRow from './PDFAudienceMetricRow';
import PDFAudienceTopContentRow from './PDFAudienceTopContentRow';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
	// The cards are laid out a section at a time: each section is a row with
	// one cell per card. A row stretches every cell to its tallest one, so each
	// section lines up across the cards whatever its content.
	grid: {
		position: 'relative',
	},
	// Each section row and the card layer split into the same columns, so every
	// section sits inside its card.
	columns: {
		flexDirection: 'row',
		columnGap: 24,
	},
	// Equal-width columns: every column grows and shrinks from a zero basis.
	column: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
	// The card surfaces are one layer behind the sections, so each card draws
	// as a single surface.
	cardLayer: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	// The dashboard tile gives the card no padding, so each section sets its
	// own inset.
	card: {
		paddingVertical: 0,
		paddingHorizontal: 0,
	},
} );

interface CardSection {
	/** A key unique among the sections. */
	key: string;
	/** Renders the section for one audience's card. */
	render: ( audience: AudienceTilePDFData ) => ReactElement;
}

/**
 * The sections of an audience card, top to bottom.
 */
const CARD_SECTIONS: CardSection[] = [
	{
		key: 'header',
		render: ( audience ) => (
			<PDFAudienceCardHeader
				audienceName={ audience.audienceName }
				isAudiencePartialData={ audience.isAudiencePartialData }
			/>
		),
	},
	{
		key: 'visitors',
		render: ( { metrics } ) => (
			<PDFAudienceMetricRow
				Icon={ PDFAudienceMetricIconVisitors }
				label={ __( 'Visitors', 'google-site-kit' ) }
				value={ numFmt( metrics.visitors.current ) }
				metric={ metrics.visitors }
			/>
		),
	},
	{
		key: 'visits-per-visitor',
		render: ( { metrics } ) => (
			<PDFAudienceMetricRow
				Icon={ PDFAudienceMetricIconVisitsPerVisitor }
				label={ __( 'Visits per visitor', 'google-site-kit' ) }
				value={ numFmt( metrics.visitsPerVisitor.current ) }
				metric={ metrics.visitsPerVisitor }
			/>
		),
	},
	{
		key: 'pages-per-visit',
		render: ( { metrics } ) => (
			<PDFAudienceMetricRow
				Icon={ PDFAudienceMetricIconPagesPerVisit }
				label={ __( 'Pages per visit', 'google-site-kit' ) }
				value={ numFmt( metrics.pagesPerVisit.current, {
					style: 'decimal',
					maximumFractionDigits: 2,
				} ) }
				metric={ metrics.pagesPerVisit }
			/>
		),
	},
	{
		key: 'pageviews',
		render: ( { metrics } ) => (
			<PDFAudienceMetricRow
				Icon={ PDFAudienceMetricIconPageviews }
				label={ sprintf(
					/* translators: %s: a percentage value such as "33.3%". */
					__( '%s of total pageviews', 'google-site-kit' ),
					numFmt( metrics.pageviews.percentageOfTotalPageViews, {
						style: 'percent',
						maximumFractionDigits: 1,
					} )
				) }
				value={ numFmt( metrics.pageviews.current ) }
				metric={ metrics.pageviews }
			/>
		),
	},
	{
		key: 'cities',
		render: ( audience ) => (
			<PDFAudienceCitiesRow topCities={ audience.topCities } />
		),
	},
	{
		key: 'top-content',
		render: ( audience ) => (
			<PDFAudienceTopContentRow
				topContent={ audience.topContent }
				isTopContentPartialData={ audience.isTopContentPartialData }
			/>
		),
	},
];

const PDFYourVisitorGroups: FC< PDFWidgetComponentProps > = ( { data } ) => {
	const audienceData = data as AudienceTilesPDFData[ 'data' ] | undefined;
	const audiences = audienceData?.audiences || [];

	// With no audiences the widget renders nothing, with no placeholder.
	if ( audiences.length === 0 ) {
		return null;
	}

	return (
		<View>
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Your visitor groups', 'google-site-kit' ) }
			</PDFTypography>
			<View style={ styles.grid }>
				<View style={ [ styles.columns, styles.cardLayer ] }>
					{ audiences.map( ( audience ) => (
						<PDFCard
							key={ audience.audienceResourceName }
							style={ [ styles.column, styles.card ] }
						/>
					) ) }
				</View>
				{ CARD_SECTIONS.map( ( section ) => (
					<View key={ section.key } style={ styles.columns }>
						{ audiences.map( ( audience ) => (
							<View
								key={ audience.audienceResourceName }
								style={ styles.column }
							>
								{ section.render( audience ) }
							</View>
						) ) }
					</View>
				) ) }
			</View>
		</View>
	);
};

export default PDFYourVisitorGroups;
