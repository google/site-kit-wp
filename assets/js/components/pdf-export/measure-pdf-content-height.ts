/**
 * Measures the rendered content height of a `@react-pdf/renderer` layout.
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

interface LayoutBox {
	top: number;
	height: number;
}

interface LayoutNode {
	box?: LayoutBox;
}

const SHAPE_ERROR =
	'@react-pdf/renderer internal layout shape unrecognised: expected layout._INTERNAL__LAYOUT__DATA_.children[0].children[].box.{top,height}. Did the package version change?';

/**
 * Reads the bottom edge of the lowest node on the first rendered page.
 *
 * The layout comes from the `onRender` callback of a `@react-pdf/renderer`
 * `Document`. Its `_INTERNAL__LAYOUT__DATA_` value is undocumented, so the
 * function throws when the expected shape is absent rather than sizing the
 * page from a bad value: a clean export failure the user can retry, not a
 * broken PDF.
 *
 * @since n.e.x.t
 *
 * @param layout The value passed to the `Document` `onRender` callback.
 * @return The content height in points.
 */
export default function measurePDFContentHeight( layout: unknown ): number {
	const layoutData = (
		layout as { _INTERNAL__LAYOUT__DATA_?: { children?: unknown } }
	 )?._INTERNAL__LAYOUT__DATA_;

	if ( ! layoutData || ! Array.isArray( layoutData.children ) ) {
		throw new Error( SHAPE_ERROR );
	}

	const page = layoutData.children[ 0 ] as { children?: unknown } | undefined;

	if ( ! page || ! Array.isArray( page.children ) ) {
		throw new Error( SHAPE_ERROR );
	}

	const children = page.children as LayoutNode[];

	if ( children.length === 0 ) {
		throw new Error( SHAPE_ERROR );
	}

	let maxBottom = 0;

	for ( const child of children ) {
		const { box } = child;

		if (
			! box ||
			typeof box.top !== 'number' ||
			typeof box.height !== 'number'
		) {
			throw new Error( SHAPE_ERROR );
		}

		maxBottom = Math.max( maxBottom, box.top + box.height );
	}

	if ( maxBottom <= 0 ) {
		throw new Error( SHAPE_ERROR );
	}

	return maxBottom;
}
