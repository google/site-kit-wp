/**
 * Test mock for `*.svg?pdf` imports.
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
import { Path, Svg } from '@react-pdf/renderer';

/**
 * Stands in for a source SVG imported with `?pdf`.
 *
 * The mock draws a placeholder square in the color the caller passes. A test can
 * then assert the size and color an icon draws, without depending on any one
 * source file's shape.
 *
 * @since 1.184.0
 *
 * @param {Object} props        Component props.
 * @param {number} props.width  The drawing's width, in page points.
 * @param {number} props.height The drawing's height, in page points.
 * @param {string} props.color  The color that replaces `currentColor`.
 * @return {Element} The placeholder drawing.
 */
export default function SvgPdfMock( { width, height, color } ) {
	return (
		<Svg width={ width } height={ height } viewBox="0 0 20 20">
			<Path d="M 0 0 L 20 0 L 20 20 L 0 20 Z" fill={ color } />
		</Svg>
	);
}
