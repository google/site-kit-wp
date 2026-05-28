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

function makePrimitive( tag ) {
	return function PDFPrimitive( props ) {
		return createElement( tag, props, props.children );
	};
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

export const Document = makePrimitive( 'pdf-document' );
export const Page = makePrimitive( 'pdf-page' );
export const View = makePrimitive( 'pdf-view' );
export const Text = makePrimitive( 'pdf-text' );
export const Image = makePrimitive( 'pdf-image' );
export const Link = makePrimitive( 'pdf-link' );
export const Svg = makePrimitive( 'pdf-svg' );
export const Path = makePrimitive( 'pdf-path' );
export const G = makePrimitive( 'pdf-g' );
export const Rect = makePrimitive( 'pdf-rect' );
export const Circle = makePrimitive( 'pdf-circle' );
export const Line = makePrimitive( 'pdf-line' );
export const Polygon = makePrimitive( 'pdf-polygon' );
export const Polyline = makePrimitive( 'pdf-polyline' );

export const Font = {
	register: () => {},
	registerHyphenationCallback: () => {},
};

export function pdf() {
	return {
		toBlob: () => Promise.resolve( new Blob() ),
		toBuffer: () => Promise.resolve( Buffer.from( '' ) ),
		toString: () => Promise.resolve( '' ),
	};
}

export const PDFViewer = makePrimitive( 'pdf-viewer' );
export const PDFDownloadLink = makePrimitive( 'pdf-download-link' );
export function BlobProvider( { children } ) {
	return typeof children === 'function'
		? children( { blob: null, url: null, loading: false, error: null } )
		: children;
}
