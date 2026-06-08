/**
 * React PDF renderer mock for Jest.
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

/*
 * `@react-pdf/renderer` pulls in `fontkit`/`restructure` which require
 * `TextEncoder` and other Node streams that JSDOM does not provide. None of
 * that machinery is meaningful in unit tests: we only need the primitives to
 * render as identifiable React host components so we can inspect the tree.
 */

/**
 * External dependencies
 */
import { createElement } from 'react';

function makePrimitive( name, tag ) {
	function PDFPrimitive( props ) {
		return createElement( tag, props, props.children );
	}
	PDFPrimitive.displayName = name;
	return PDFPrimitive;
}

export const StyleSheet = {
	create( styles ) {
		return styles;
	},
	flatten( style ) {
		if ( Array.isArray( style ) ) {
			return Object.assign( {}, ...style.filter( Boolean ) );
		}
		return style || {};
	},
};

export const Document = makePrimitive( 'Document', 'pdf-document' );
export const Page = makePrimitive( 'Page', 'pdf-page' );
export const View = makePrimitive( 'View', 'pdf-view' );
export const Text = makePrimitive( 'Text', 'pdf-text' );
export const Image = makePrimitive( 'Image', 'pdf-image' );
export const Link = makePrimitive( 'Link', 'pdf-link' );
export const Note = makePrimitive( 'Note', 'pdf-note' );
export const Canvas = makePrimitive( 'Canvas', 'pdf-canvas' );
export const Svg = makePrimitive( 'Svg', 'pdf-svg' );
export const Path = makePrimitive( 'Path', 'pdf-path' );
export const G = makePrimitive( 'G', 'pdf-g' );
export const Rect = makePrimitive( 'Rect', 'pdf-rect' );
export const Circle = makePrimitive( 'Circle', 'pdf-circle' );
export const Line = makePrimitive( 'Line', 'pdf-line' );
export const Polygon = makePrimitive( 'Polygon', 'pdf-polygon' );
export const Polyline = makePrimitive( 'Polyline', 'pdf-polyline' );

export const Font = {
	register: jest.fn(),
	registerHyphenationCallback: jest.fn(),
	getRegisteredFonts: jest.fn( () => [] ),
	clear: jest.fn(),
};

export const pdf = jest.fn( () => ( {
	toBlob: jest.fn( () =>
		Promise.resolve(
			new Blob( [ 'mock-pdf' ], { type: 'application/pdf' } )
		)
	),
	toBuffer: jest.fn( () => Promise.resolve( Buffer.from( 'mock-pdf' ) ) ),
	toString: jest.fn( () => Promise.resolve( 'mock-pdf' ) ),
	updateContainer: jest.fn(),
	on: jest.fn(),
} ) );

export const PDFViewer = makePrimitive( 'PDFViewer', 'pdf-viewer' );
export const PDFDownloadLink = makePrimitive(
	'PDFDownloadLink',
	'pdf-download-link'
);
export function BlobProvider( { children } ) {
	return typeof children === 'function'
		? children( { blob: null, url: null, loading: false, error: null } )
		: null;
}
