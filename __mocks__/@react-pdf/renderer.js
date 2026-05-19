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

const React = require( 'react' );

function makePrimitive( tag ) {
	return function PDFPrimitive( props ) {
		return React.createElement( tag, props, props.children );
	};
}

const StyleSheet = {
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

module.exports = {
	Document: makePrimitive( 'pdf-document' ),
	Page: makePrimitive( 'pdf-page' ),
	View: makePrimitive( 'pdf-view' ),
	Text: makePrimitive( 'pdf-text' ),
	Image: makePrimitive( 'pdf-image' ),
	Link: makePrimitive( 'pdf-link' ),
	Svg: makePrimitive( 'pdf-svg' ),
	Path: makePrimitive( 'pdf-path' ),
	G: makePrimitive( 'pdf-g' ),
	Rect: makePrimitive( 'pdf-rect' ),
	Circle: makePrimitive( 'pdf-circle' ),
	Line: makePrimitive( 'pdf-line' ),
	Polygon: makePrimitive( 'pdf-polygon' ),
	Polyline: makePrimitive( 'pdf-polyline' ),
	StyleSheet,
	Font: {
		register: () => {},
		registerHyphenationCallback: () => {},
	},
	pdf: () => ( {
		toBlob: () => Promise.resolve( new Blob() ),
		toBuffer: () => Promise.resolve( Buffer.from( '' ) ),
		toString: () => Promise.resolve( '' ),
	} ),
	PDFViewer: makePrimitive( 'pdf-viewer' ),
	PDFDownloadLink: makePrimitive( 'pdf-download-link' ),
	BlobProvider: ( { children } ) =>
		typeof children === 'function'
			? children( { blob: null, url: null, loading: false, error: null } )
			: children,
};
