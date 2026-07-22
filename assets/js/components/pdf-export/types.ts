/**
 * PDF export report types.
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
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import type {
	PDFWidgetComponent,
	PDFWidgetComponentProps,
} from '@/js/googlesitekit/widgets/types';

export type { PDFWidgetComponentProps };

/**
 * A section icon rendered with `@react-pdf/renderer` SVG primitives.
 *
 * @since 1.182.0
 */
export type PDFIcon = FC< {
	size?: number;
	color?: string;
} >;

/**
 * The props a `?pdf` SVG import accepts.
 *
 * `assets/js/types/svg.d.ts` types every `?pdf` import with this interface, so
 * an import and the icon that wraps it always take the same props.
 *
 * @since n.e.x.t
 */
export interface PDFSvgFileProps {
	/** The drawing's width, in page points. */
	width?: number;
	/** The drawing's height, in page points. */
	height?: number;
	/** The color that replaces `currentColor` in the source file. */
	color?: string;
}

/**
 * One header section chip: a dashboard area surfaced in the PDF.
 *
 * @since 1.182.0
 */
export interface PDFHeaderSection {
	slug: string;
	label: string;
	Icon?: PDFIcon;
}

/**
 * A named-destination anchor for one report section: the anchor `id` the
 * header chips link to, and the section's absolute top on the page in points.
 *
 * @since n.e.x.t
 */
export interface PDFSectionAnchor {
	id: string;
	top: number;
}

/**
 * A loaded PDF widget ready to render into the report document.
 *
 * @since 1.181.0
 */
export interface PDFReportWidget {
	slug: string;
	label?: string;
	Component: PDFWidgetComponent | null;
	data?: unknown;
	chartImages?: Record< string, string >;
}

/**
 * One report section (one widget area) with its loaded widgets.
 *
 * @since 1.181.0
 */
export interface PDFReportArea {
	areaSlug: string;
	areaTitle: string;
	widgets: PDFReportWidget[];
}
