/**
 * `@react-pdf/renderer` jest mock.
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

// Manual Jest mock for `@react-pdf/renderer`. The real package ships ESM
// with native deps that fail in jsdom. CommonJS to match `__mocks__/tabbable.js`.

/**
 * External dependencies
 */
const React = require( 'react' );

function passthrough( name ) {
	function Component( props ) {
		return React.createElement(
			name.toLowerCase(),
			{ 'data-react-pdf': name, ...props },
			props && props.children
		);
	}
	Component.displayName = name;
	return Component;
}

const Document = passthrough( 'Document' );
const Page = passthrough( 'Page' );
const View = passthrough( 'View' );
const Text = passthrough( 'Text' );
const Image = passthrough( 'Image' );
const Link = passthrough( 'Link' );
const Note = passthrough( 'Note' );
const Canvas = passthrough( 'Canvas' );

const StyleSheet = {
	create: ( styles ) => styles,
	flatten: ( style ) => Object.assign( {}, ...[].concat( style || {} ) ),
};

const Font = {
	register: jest.fn(),
	getRegisteredFonts: jest.fn( () => [] ),
	clear: jest.fn(),
};

const pdf = jest.fn( () => ( {
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

const PDFViewer = passthrough( 'PDFViewer' );
const PDFDownloadLink = passthrough( 'PDFDownloadLink' );
function BlobProvider( { children } ) {
	return typeof children === 'function'
		? children( { blob: null, url: null, loading: false, error: null } )
		: null;
}

module.exports = {
	Document,
	Page,
	View,
	Text,
	Image,
	Link,
	Note,
	Canvas,
	StyleSheet,
	Font,
	pdf,
	PDFViewer,
	PDFDownloadLink,
	BlobProvider,
	__esModule: true,
	default: {
		Document,
		Page,
		View,
		Text,
		Image,
		Link,
		Note,
		Canvas,
		StyleSheet,
		Font,
		pdf,
		PDFViewer,
		PDFDownloadLink,
		BlobProvider,
	},
};
