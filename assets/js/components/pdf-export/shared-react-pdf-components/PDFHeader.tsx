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
import { Link, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PDF_FONT_FAMILY_DISPLAY,
	PDF_FONT_FAMILY_TEXT,
	PDF_HEADER_COLORS,
} from '@/js/components/pdf-export/pdf-theme';
import type { PDFHeaderSection } from '@/js/components/pdf-export/types';
import { getLocale, isValidDateString, stringToDate } from '@/js/util';
import PDFHeaderSectionChip from './PDFHeaderSectionChip';
import PDFSiteKitLogo from './PDFSiteKitLogo';

// Material "chevron_right" geometry (viewBox 0 0 24 24).
const CHEVRON_RIGHT_PATH = 'M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z';

/**
 * Extracts the host (e.g. "www.example.com") from the reference site URL for
 * display as the header's site address.
 *
 * @since n.e.x.t
 *
 * @param {string} siteURL The reference site URL.
 * @return {string} The host, or the original value when it cannot be parsed.
 */
function getSiteHost( siteURL: string ): string {
	try {
		return new URL( siteURL ).host;
	} catch {
		return siteURL;
	}
}

/**
 * Formats a `YYYY-MM-DD` date as a localized short date, e.g. "Jan 1, 2021".
 *
 * Returns an empty string for missing/invalid input: `stringToDate` throws on a
 * non-`YYYY-MM-DD` string, which would otherwise abort the whole PDF render.
 *
 * @since n.e.x.t
 *
 * @param {string} dateString The date in `YYYY-MM-DD` format.
 * @return {string} The localized date, or an empty string.
 */
function formatHeaderDate( dateString: string ): string {
	if ( ! isValidDateString( dateString ) ) {
		return '';
	}

	return new Intl.DateTimeFormat( getLocale(), {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	} ).format( stringToDate( dateString ) );
}

const styles = StyleSheet.create( {
	header: {
		backgroundColor: '#FFFFFF',
		marginTop: -24,
		marginHorizontal: -24,
		marginBottom: 24,
		paddingTop: 16,
		paddingHorizontal: 24,
		paddingBottom: 6,
	},
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	divider: {
		width: 1,
		height: 28,
		backgroundColor: PDF_HEADER_COLORS.chipBorder,
		marginHorizontal: 12,
	},
	titleBlock: {
		flexGrow: 1,
		flexShrink: 1,
	},
	title: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 14,
		lineHeight: 20 / 14,
		letterSpacing: 0.25,
		color: PDF_HEADER_COLORS.subtitle,
		marginBottom: 2,
	},
	dateRange: {
		fontFamily: PDF_FONT_FAMILY_DISPLAY,
		fontSize: 22,
		fontWeight: 400,
		lineHeight: 28 / 22,
		color: PDF_HEADER_COLORS.title,
	},
	siteBlock: {
		flexShrink: 0,
		marginLeft: 16,
		alignItems: 'flex-end',
	},
	siteLink: {
		textDecoration: 'none',
	},
	siteURL: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 14,
		fontWeight: 400,
		lineHeight: 20 / 14,
		letterSpacing: 0.25,
		color: PDF_HEADER_COLORS.siteURL,
	},
	chipRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	chips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		flexGrow: 1,
		flexShrink: 1,
	},
	chipWrapper: {
		marginRight: 8,
		marginBottom: 8,
	},
	viewDashboard: {
		flexShrink: 0,
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 8,
		textDecoration: 'none',
	},
	viewDashboardText: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 14,
		fontWeight: 500,
		lineHeight: 20 / 14,
		letterSpacing: 0,
		color: PDF_HEADER_COLORS.link,
		marginRight: 2,
	},
} );

export interface PDFHeaderProps {
	siteURL: string;
	dashboardURL?: string;
	dateRange: {
		startDate: string;
		endDate: string;
	};
	sections: PDFHeaderSection[];
}

const PDFHeader: FC< PDFHeaderProps > = ( {
	siteURL,
	dashboardURL,
	dateRange,
	sections,
} ) => {
	const startDate = formatHeaderDate( dateRange.startDate );
	const endDate = formatHeaderDate( dateRange.endDate );
	// Avoid a dangling " - " when one (or both) of the dates is invalid.
	const formattedDateRange =
		startDate && endDate
			? `${ startDate } - ${ endDate }`
			: startDate || endDate;

	return (
		<View style={ styles.header }>
			<View style={ styles.topRow }>
				<PDFSiteKitLogo />
				<View style={ styles.divider } />
				<View style={ styles.titleBlock }>
					<Text style={ styles.title }>
						{ __( "Your site's performance", 'google-site-kit' ) }
					</Text>
					<Text style={ styles.dateRange }>
						{ formattedDateRange }
					</Text>
				</View>
				<View style={ styles.siteBlock }>
					{ dashboardURL ? (
						<Link src={ dashboardURL } style={ styles.siteLink }>
							<Text style={ styles.siteURL }>
								{ getSiteHost( siteURL ) }
							</Text>
						</Link>
					) : (
						<Text style={ styles.siteURL }>
							{ getSiteHost( siteURL ) }
						</Text>
					) }
				</View>
			</View>
			<View style={ styles.chipRow }>
				<View style={ styles.chips }>
					{ sections.map( ( { slug, label, Icon } ) => (
						<View key={ slug } style={ styles.chipWrapper }>
							<PDFHeaderSectionChip
								label={ label }
								Icon={ Icon }
							/>
						</View>
					) ) }
				</View>
				<Link src={ dashboardURL } style={ styles.viewDashboard }>
					<Text style={ styles.viewDashboardText }>
						{ __(
							'View dashboard in Site Kit',
							'google-site-kit'
						) }
					</Text>
					<Svg width={ 10 } height={ 10 } viewBox="0 0 24 24">
						<Path
							d={ CHEVRON_RIGHT_PATH }
							fill={ PDF_HEADER_COLORS.link }
						/>
					</Svg>
				</Link>
			</View>
		</View>
	);
};

export default PDFHeader;
