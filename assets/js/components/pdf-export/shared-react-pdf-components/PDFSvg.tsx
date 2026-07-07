/**
 * Shared SVG wrapper for the PDF report.
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
import { Svg } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';

export interface PDFSvgProps {
	/** Width in pixels. The component scales it to page points. */
	width: number;
	/** Height in pixels. The component scales it to page points. */
	height: number;
	/** The `viewBox` for the SVG's own coordinate system. */
	viewBox: string;
}

const PDFSvg: FC< PDFSvgProps > = ( { width, height, viewBox, children } ) => (
	<Svg
		width={ scalePDFValue( width ) }
		height={ scalePDFValue( height ) }
		viewBox={ viewBox }
	>
		{ children }
	</Svg>
);

export default PDFSvg;
