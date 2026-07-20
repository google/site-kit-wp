/**
 * Shared icons for the PDF export (@react-pdf/renderer).
 *
 * `@react-pdf` can't render the dashboard's SVGR icons, so each icon here
 * imports its source `assets/svg/icons/*.svg` file with `?pdf`. The build draws
 * that file with `@react-pdf/renderer` primitives, so an edit to the SVG also
 * changes the PDF icon.
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
import { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import AudienceMetricIconCities from '@/svg/icons/audience-metric-icon-cities.svg?pdf';
import AudienceMetricIconPagesPerVisit from '@/svg/icons/audience-metric-icon-pages-per-visit.svg?pdf';
import AudienceMetricIconPageviews from '@/svg/icons/audience-metric-icon-pageviews.svg?pdf';
import AudienceMetricIconTopContent from '@/svg/icons/audience-metric-icon-top-content.svg?pdf';
import AudienceMetricIconVisitors from '@/svg/icons/audience-metric-icon-visitors.svg?pdf';
import AudienceMetricIconVisitsPerVisitor from '@/svg/icons/audience-metric-icon-visits-per-visitor.svg?pdf';
import { scalePDFValue } from './pdf-scale';
import { PDF_COLORS } from './pdf-theme';
import { PDFIcon, PDFSvgFileProps } from './types';

/** The default icon size in pixels, before it scales to page points. */
const PDF_ICON_SIZE = 20;

/**
 * Wraps a source SVG file, imported with `?pdf`, as a PDF report icon.
 *
 * @since n.e.x.t
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
