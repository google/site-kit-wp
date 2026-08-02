/**
 * Shared icons for the PDF export (@react-pdf/renderer).
 *
 * `@react-pdf` can't render the dashboard's SVGR icons, so each icon here
 * imports its source `assets/svg/icons/*.svg` file with `?pdf`. The build draws
 * that file with `@react-pdf/renderer` primitives, so an edit to the SVG also
 * changes the PDF icon.
 *
 * The Google "G" is the one icon that comes in as an image. The letter needs a
 * mask and a conic gradient that `@react-pdf/renderer` can't draw.
 *
 * Each export adds a `PDF` prefix to the dashboard icon's name.
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
import { Image } from '@react-pdf/renderer';
import { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import AudienceMetricIconCities from '@/svg/icons/audience-metric-icon-cities.svg?pdf';
import AudienceMetricIconPagesPerVisit from '@/svg/icons/audience-metric-icon-pages-per-visit.svg?pdf';
import AudienceMetricIconPageviews from '@/svg/icons/audience-metric-icon-pageviews.svg?pdf';
import AudienceMetricIconTopContent from '@/svg/icons/audience-metric-icon-top-content.svg?pdf';
import AudienceMetricIconVisitors from '@/svg/icons/audience-metric-icon-visitors.svg?pdf';
import AudienceMetricIconVisitsPerVisitor from '@/svg/icons/audience-metric-icon-visits-per-visitor.svg?pdf';
import ChevronRight from '@/svg/icons/chevron-right.svg?pdf';
import NavContentIcon from '@/svg/icons/nav-content-icon.svg?pdf';
import NavKeyMetricsIcon from '@/svg/icons/nav-key-metrics-icon.svg?pdf';
import NavMonetizationIcon from '@/svg/icons/nav-monetization-icon.svg?pdf';
import NavSpeedIcon from '@/svg/icons/nav-speed-icon.svg?pdf';
import NavTrafficIcon from '@/svg/icons/nav-traffic-icon.svg?pdf';
import StarFill from '@/svg/icons/star-fill.svg?pdf';
import logoGImage from './images/logo-g.png';
import { scalePDFValue } from './pdf-scale';
import { PDF_COLORS } from './pdf-theme';
import { PDFIcon, PDFSvgFileProps } from './types';

/** The default icon size in pixels, before it scales to page points. */
const PDF_ICON_SIZE = 20;

/**
 * Wraps a source SVG file, imported with `?pdf`, as a PDF report icon.
 *
 * @since 1.184.0
 *
 * @param SvgFile      The SVG file's component, from a `?pdf` import.
 * @param defaultColor Optional. The color to draw when the caller sets none. Defaults to `SURFACES_ON_SURFACE_VARIANT`, the muted color the dashboard draws these icons in.
 * @return An icon that takes a `size` in pixels and a `color`.
 */
function createPDFIcon(
	SvgFile: ComponentType< PDFSvgFileProps >,
	defaultColor: string = PDF_COLORS.SURFACES_ON_SURFACE_VARIANT
): PDFIcon {
	return function Icon( { size = PDF_ICON_SIZE, color = defaultColor } ) {
		return (
			<SvgFile
				width={ scalePDFValue( size ) }
				height={ scalePDFValue( size ) }
				color={ color }
			/>
		);
	};
}

/**
 * Creates a PDF report icon from an image.
 *
 * The icon uses `size` as the height, and multiplies `size` by `aspectRatio` for
 * the width. The image keeps its proportions at any size.
 *
 * @since n.e.x.t
 *
 * @param {string} src         The image's URL, from a `.png` import.
 * @param {number} aspectRatio The image's width divided by its height.
 * @return {PDFIcon} An icon that takes a `size` in pixels. It ignores `color`.
 */
function createPDFImageIcon( src: string, aspectRatio: number ): PDFIcon {
	return function Icon( { size = PDF_ICON_SIZE } ) {
		return (
			<Image
				src={ src }
				style={ {
					width: scalePDFValue( size * aspectRatio ),
					height: scalePDFValue( size ),
				} }
			/>
		);
	};
}

export const PDFAudienceMetricIconVisitors = createPDFIcon(
	AudienceMetricIconVisitors
);
export const PDFAudienceMetricIconVisitsPerVisitor = createPDFIcon(
	AudienceMetricIconVisitsPerVisitor
);
export const PDFAudienceMetricIconPagesPerVisit = createPDFIcon(
	AudienceMetricIconPagesPerVisit
);
export const PDFAudienceMetricIconPageviews = createPDFIcon(
	AudienceMetricIconPageviews
);
export const PDFAudienceMetricIconCities = createPDFIcon(
	AudienceMetricIconCities
);
export const PDFAudienceMetricIconTopContent = createPDFIcon(
	AudienceMetricIconTopContent
);

export const PDFNavKeyMetricsIcon = createPDFIcon(
	NavKeyMetricsIcon,
	PDF_COLORS.SURFACES_ON_SURFACE
);
export const PDFNavTrafficIcon = createPDFIcon(
	NavTrafficIcon,
	PDF_COLORS.SURFACES_ON_SURFACE
);
export const PDFNavContentIcon = createPDFIcon(
	NavContentIcon,
	PDF_COLORS.SURFACES_ON_SURFACE
);
export const PDFNavSpeedIcon = createPDFIcon(
	NavSpeedIcon,
	PDF_COLORS.SURFACES_ON_SURFACE
);
export const PDFNavMonetizationIcon = createPDFIcon(
	NavMonetizationIcon,
	PDF_COLORS.SURFACES_ON_SURFACE
);

/**
 * Gives the Google "G" its width from its height and keeps the letter from stretching.
 *
 * @since n.e.x.t
 */
export const LOGO_G_ASPECT_RATIO = 23.599 / 24.1136;

export const PDFLogoG = createPDFImageIcon( logoGImage, LOGO_G_ASPECT_RATIO );

export const PDFStarFill = createPDFIcon( StarFill, PDF_COLORS.VIOLET_V_600 );
export const PDFChevronRight = createPDFIcon(
	ChevronRight,
	PDF_COLORS.CONTENT_SECONDARY
);

/**
 * Maps a dashboard context slug to its section icon.
 *
 * The map covers the main-dashboard contexts that draw an icon in the report.
 * Site goals has no entry, so `PDFChip` renders its chip with a label only.
 *
 * @since n.e.x.t
 */
export const SECTION_ICONS: Record< string, PDFIcon > = {
	[ CONTEXT_MAIN_DASHBOARD_KEY_METRICS ]: PDFNavKeyMetricsIcon,
	[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ]: PDFNavTrafficIcon,
	[ CONTEXT_MAIN_DASHBOARD_CONTENT ]: PDFNavContentIcon,
	[ CONTEXT_MAIN_DASHBOARD_SPEED ]: PDFNavSpeedIcon,
	[ CONTEXT_MAIN_DASHBOARD_MONETIZATION ]: PDFNavMonetizationIcon,
};
