/**
 * PDFHeader: report header strip rendered with @react-pdf/renderer.
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
import { Path, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatDateString } from '@/js/components/pdf-export/formatDateString';
import {
	PDF_PAGE_PADDING,
	createPDFStyles,
} from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import { PDFHeaderSection } from '@/js/components/pdf-export/types';
import PDFChip from './PDFChip';
import PDFLink from './PDFLink';
import PDFSiteKitLogo from './PDFSiteKitLogo';
import PDFSvg from './PDFSvg';
import PDFTypography from './PDFTypography';

/**
 * `@react-pdf` can't render the app's imported SVG components, so the
 * chevron icon's path data is inline.
 */
const CHEVRON_RIGHT_PATH =
	'M3.34374 9.16666L2.60416 8.42708L6.03124 5L2.60416 1.57291L3.34374 0.833328L7.51041 5L3.34374 9.16666Z';

/**
 * Extracts the host (e.g. "www.example.com") from the reference site URL for
 * display as the header's site address.
 *
 * @since 1.182.0
 *
 * @param siteURL The reference site URL.
 * @return The host, or the original value when it cannot be parsed.
 */
function getSiteHost( siteURL: string ): string {
	try {
		return new URL( siteURL ).host;
	} catch {
		return siteURL;
	}
}

/**
 * The page adds padding around its content. The header uses negative margins
 * to pull its white background to the page edges. It then uses matching
 * padding to keep its text at the page margin.
 */
const headerFullWidthOffsets = {
	marginTop: -PDF_PAGE_PADDING,
	marginHorizontal: -PDF_PAGE_PADDING,
	paddingHorizontal: PDF_PAGE_PADDING,
};

const styles = createPDFStyles( {
	header: {
		backgroundColor: PDF_COLORS.SURFACES_SURFACE,
		marginBottom: 24,
		paddingTop: 16,
		paddingBottom: 11,
	},
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 29,
	},
	divider: {
		width: 1,
		height: 39,
		backgroundColor: PDF_COLORS.SURFACES_SURFACE_1,
		marginHorizontal: 22,
	},
	titleBlock: {
		flexGrow: 1,
		flexShrink: 1,
	},
	siteBlock: {
		flexShrink: 0,
		marginLeft: 16,
		alignItems: 'flex-end',
	},
	chipRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	chips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		flexGrow: 1,
		flexShrink: 1,
		rowGap: 8,
	},
	chipWrapper: {
		marginRight: 24,
	},
	viewDashboard: {
		flexShrink: 0,
		marginLeft: 8,
	},
	viewDashboardLink: {
		// Gap between the "View dashboard in Site Kit" text and its chevron icon.
		marginRight: 4,
	},
} );

export interface PDFHeaderProps {
	/** The site URL. The header shows its host. */
	siteURL: string;
	/** Golink URL opening the Site Kit dashboard. The host and the "View dashboard in Site Kit" link open it. */
	dashboardURL?: string;
	/** The report date range, shown under the header title. */
	dateRange: {
		/** The first day of the range, as `YYYY-MM-DD`. */
		startDate: string;
		/** The last day of the range, as `YYYY-MM-DD`. */
		endDate: string;
	};
	/** The sections rendered as chips, in order. */
	sections: PDFHeaderSection[];
}

const PDFHeader: FC< PDFHeaderProps > = ( {
	siteURL,
	dashboardURL,
	dateRange,
	sections,
} ) => {
	const startDate = formatDateString( dateRange.startDate );
	const endDate = formatDateString( dateRange.endDate );
	/** Avoid a dangling " - " when one (or both) of the dates is invalid. */
	const formattedDateRange =
		startDate && endDate
			? `${ startDate } - ${ endDate }`
			: startDate || endDate;

	return (
		<View style={ [ styles.header, headerFullWidthOffsets ] }>
			<View style={ styles.topRow }>
				<PDFSiteKitLogo />
				<View style={ styles.divider } />
				<View style={ styles.titleBlock }>
					<PDFTypography
						style={ {
							color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
						} }
					>
						{ __( "Your site's performance", 'google-site-kit' ) }
					</PDFTypography>
					<PDFTypography type="headline" size="small">
						{ formattedDateRange }
					</PDFTypography>
				</View>
				<View style={ styles.siteBlock }>
					{ dashboardURL ? (
						<PDFLink
							href={ dashboardURL }
							style={ {
								color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
							} }
						>
							{ getSiteHost( siteURL ) }
						</PDFLink>
					) : (
						<PDFTypography
							style={ {
								color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
							} }
						>
							{ getSiteHost( siteURL ) }
						</PDFTypography>
					) }
				</View>
			</View>
			<View style={ styles.chipRow }>
				<View style={ styles.chips }>
					{ sections.map( ( { slug, label, Icon } ) => (
						<View key={ slug } style={ styles.chipWrapper }>
							<PDFChip label={ label } Icon={ Icon } />
						</View>
					) ) }
				</View>
				<View style={ styles.viewDashboard }>
					<PDFLink
						href={ dashboardURL }
						type="label"
						style={ styles.viewDashboardLink }
						trailingIcon={
							<PDFSvg
								width={ 10 }
								height={ 10 }
								viewBox="0 0 10 10"
							>
								<Path
									d={ CHEVRON_RIGHT_PATH }
									fill={ PDF_COLORS.CONTENT_SECONDARY }
								/>
							</PDFSvg>
						}
					>
						{ __(
							'View dashboard in Site Kit',
							'google-site-kit'
						) }
					</PDFLink>
				</View>
			</View>
		</View>
	);
};

export default PDFHeader;
