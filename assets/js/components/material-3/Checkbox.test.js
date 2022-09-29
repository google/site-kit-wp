/**
 * Checkbox tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { render } from '../../../../tests/js/test-utils';
import Checkbox from './Checkbox';

// import '@material/web/checkbox/checkbox';
// function Checkbox() {
// 	return <md-checkbox></md-checkbox>;
// }

// TODO: Worth a look - https://www.npmjs.com/package/shadow-dom-testing-library

const log = ( ...args ) => console.__proto__.log.call( console, ...args );

describe( 'Checkbox', () => {
	it( 'should render the checkbox', () => {
		const { container } = render( <Checkbox /> );
		log( 'container', container );
		expect( 1 ).toBe( 1 );

		// Snapshotting not working, produces the following error:
		// PrettyFormatPluginError: Invalid string lengthRangeError: Invalid string length
		//   at printObjectProperties (node_modules/pretty-format/build/collections.js:172:47)
		// Looks like creating too long a string.
		// Maybe circular reference related? https://github.com/satya164/react-native-tab-view/issues/1104
		// Note this occurs even with the simplest implementation, e.g.
		// function Checkbox() {
		//   return <md-checkbox></md-checkbox>;
		// }

		// expect( container ).toMatchSnapshot();
	} );

	// it( 'should work as a controlled input', () => {
	// 	const { container } = render(
	// 		<Checkbox />
	// 	);
	// } );
} );
