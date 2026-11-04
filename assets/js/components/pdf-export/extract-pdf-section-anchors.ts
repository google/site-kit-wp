/**
 * Extracts section anchor positions from a `@react-pdf/renderer` layout.
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
 * Internal dependencies
 */
import { PDFSectionAnchor } from './types';

interface LayoutNodeShape {
	box?: { top?: unknown };
	props?: { id?: unknown };
	children?: unknown;
}

export const PDF_SECTION_ID_PREFIX = 'section-';

function walk(
	node: LayoutNodeShape,
	parentTop: number,
	anchors: PDFSectionAnchor[]
): void {
	const relativeTop = typeof node.box?.top === 'number' ? node.box.top : 0;
	const top = parentTop + relativeTop;

	const id = node.props?.id;
	if ( typeof id === 'string' && id.startsWith( PDF_SECTION_ID_PREFIX ) ) {
		anchors.push( { id, top } );
	}

	if ( Array.isArray( node.children ) ) {
		node.children.forEach( ( child ) =>
			walk( child as LayoutNodeShape, top, anchors )
		);
	}
}

/**
 * Collects each section node's `id` and absolute top from the measurement
 * pass layout.
 *
 * `@react-pdf` registers a named destination from a node's parent-relative
 * top, so an `id` deep in the tree lands the viewer too high. The final
 * render pass instead places zero-size anchors directly on the page, at the
 * absolute tops this function reads by summing each node's offset down the
 * tree.
 *
 * Returns an empty list when the layout holds no section nodes; the shape
 * itself is guarded by `measurePDFContentHeight`, which runs on the same
 * layout first.
 *
 * @since 1.186.0
 *
 * @param layout The value passed to the `Document` `onRender` callback.
 * @return The section anchors in document order.
 */
export default function extractPDFSectionAnchors(
	layout: unknown
): PDFSectionAnchor[] {
	const layoutData = (
		layout as { _INTERNAL__LAYOUT__DATA_?: { children?: unknown } }
	 )?._INTERNAL__LAYOUT__DATA_;

	const children = layoutData?.children;
	const page = Array.isArray( children ) ? children[ 0 ] : undefined;

	if ( ! page ) {
		return [];
	}

	const anchors: PDFSectionAnchor[] = [];
	walk( page as LayoutNodeShape, 0, anchors );

	return anchors;
}
