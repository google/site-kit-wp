/**
 * DashboardReport: minimal `react-pdf` Document used by the MVP export.
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
import { Document, Page, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PDF_PAGE_PADDING,
	PDF_PAGE_WIDTH,
	createPDFStyles,
} from '@/js/components/pdf-export/pdf-scale';
import {
	PDF_COLORS,
	PDF_FONT_FAMILY_TEXT,
} from '@/js/components/pdf-export/pdf-theme';
import PDFFooter from '@/js/components/pdf-export/shared-react-pdf-components/PDFFooter';
import {
	PDFHeaderSection,
	PDFReportArea,
	PDFReportWidget,
} from '@/js/components/pdf-export/types';
import PDFEmailReportingNotice from './PDFEmailReportingNotice';
import PDFHeader from './PDFHeader';
import PDFTypography from './PDFTypography';

const DEFAULT_PAGE_HEIGHT = 792;

const styles = createPDFStyles( {
	page: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		backgroundColor: PDF_COLORS.SURFACES_BACKGROUND,
	},
	body: {
		flexGrow: 1,
		// The report body owns the spacing between areas, so no area or widget
		// sets its own outer margin.
		gap: 50,
	},
	// Gap between the widgets inside one area.
	widgets: {
		gap: 30,
	},
	// Gap below an area title and above its first widget.
	areaTitle: {
		marginBottom: 20,
	},
} );

/**
 * A report widget whose component chunk loaded, ready to render.
 */
type RenderableWidget = PDFReportWidget & {
	Component: NonNullable< PDFReportWidget[ 'Component' ] >;
};

/**
 * Determines whether a report widget has content to render.
 *
 * A widget without a component failed to load, and a widget without data has
 * an empty or failed report behind it. The report skips both.
 *
 * @since n.e.x.t
 *
 * @param widget A loaded report widget entry.
 * @return `true` when the widget has content to render.
 */
function isRenderableWidget(
	widget: PDFReportWidget
): widget is RenderableWidget {
	return Boolean( widget.Component && widget.data );
}

export interface DashboardReportProps {
	/** The site name, shown in the PDF document title. */
	siteName: string;
	/** The site URL. The header shows its host. */
	siteURL: string;
	/** Golink URL opening the Site Kit dashboard. The header links to it. */
	dashboardURL: string;
	/** The report date range, shown in the header. */
	dateRange: {
		/** The first day of the range, as `YYYY-MM-DD`. */
		startDate: string;
		/** The last day of the range, as `YYYY-MM-DD`. */
		endDate: string;
	};
	/** The header chip sections. The report keeps only the chips of areas with content. */
	sections: PDFHeaderSection[];
	/** Golink URL opening the Site Kit help center, for the footer. */
	helpCenterURL: string;
	/** Golink URL opening the Google privacy policy, for the footer. */
	privacyPolicyURL: string;
	/** The page height in points. Defaults to the US letter height. */
	pageHeight?: number;
	/** The report areas, each holding its widgets. */
	areas?: PDFReportArea[];
	/** Golink URL for the "Set up email reports" button in the email reporting notice. */
	emailReportingSetupURL?: string;
}

const DashboardReport: FC< DashboardReportProps > = ( {
	siteName,
	siteURL,
	dashboardURL,
	dateRange,
	sections,
	helpCenterURL,
	privacyPolicyURL,
	pageHeight = DEFAULT_PAGE_HEIGHT,
	areas = [],
	emailReportingSetupURL,
} ) => {
	/**
	 * An area renders only the widgets with content. The report skips an area
	 * where no widget has content, and the header shows no chip for it, so
	 * the report holds no empty section.
	 */
	const renderableAreas = areas
		.map( ( area ) => ( {
			...area,
			widgets: area.widgets.filter( isRenderableWidget ),
		} ) )
		.filter( ( { widgets } ) => widgets.length > 0 );

	const renderableAreaSlugs = new Set(
		renderableAreas.map( ( { areaSlug } ) => areaSlug )
	);
	const renderableSections = sections.filter( ( { slug } ) =>
		renderableAreaSlugs.has( slug )
	);

	return (
		<Document
			title={
				siteName
					? sprintf(
							/* translators: %s: Site name. */
							__( '%s – Site Kit report', 'google-site-kit' ),
							siteName
					  )
					: __( 'Site Kit Dashboard Report', 'google-site-kit' )
			}
			author="Site Kit by Google"
		>
			<Page
				size={ [ PDF_PAGE_WIDTH, pageHeight ] }
				style={ [ styles.page, { padding: PDF_PAGE_PADDING } ] }
				wrap={ false }
			>
				<PDFHeader
					siteURL={ siteURL }
					dashboardURL={ dashboardURL }
					dateRange={ dateRange }
					sections={ renderableSections }
				/>
				<View style={ styles.body }>
					{ renderableAreas.length === 0 && (
						<PDFTypography
							size="small"
							style={ {
								color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
							} }
						>
							{ __(
								'No report data available.',
								'google-site-kit'
							) }
						</PDFTypography>
					) }
					{ renderableAreas.map(
						( { areaSlug, areaTitle, widgets } ) => (
							<View key={ `section-${ areaSlug }` }>
								<PDFTypography
									type="headline"
									style={ styles.areaTitle }
								>
									{ areaTitle }
								</PDFTypography>
								<View style={ styles.widgets }>
									{ widgets.map(
										( {
											slug,
											Component,
											data,
											chartImages,
										} ) => (
											<Component
												key={ slug }
												data={ data }
												chartImages={ chartImages }
											/>
										)
									) }
								</View>
							</View>
						)
					) }
				</View>
				<PDFEmailReportingNotice
					emailReportingSetupURL={ emailReportingSetupURL }
				/>
				<PDFFooter
					dashboardURL={ dashboardURL }
					helpCenterURL={ helpCenterURL }
					privacyPolicyURL={ privacyPolicyURL }
				/>
			</Page>
		</Document>
	);
};

export default DashboardReport;
