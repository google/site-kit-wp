/**
 * PDFSectionCheckboxes tests.
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
import { PDF_SECTIONS } from '@/js/components/pdf-generation/constants';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';

describe( 'PDFSectionCheckboxes', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders a checkbox per hard-coded section with checked state from props', () => {
		const selected = [ 'summary', 'traffic' ];

		const { getByRole } = render(
			<PDFSectionCheckboxes
				selectedSections={ selected }
				toggleSection={ () => {} }
			/>,
			{ registry }
		);

		const checkedStates = PDF_SECTIONS.map( ( { slug, title } ) => {
			const checkbox = getByRole( 'checkbox', {
				name: new RegExp( `${ title }$` ),
			} ) as HTMLInputElement;
			return { slug, checked: checkbox.checked };
		} );

		expect( checkedStates ).toEqual(
			PDF_SECTIONS.map( ( { slug } ) => ( {
				slug,
				checked: selected.includes( slug ),
			} ) )
		);
	} );

	it( 'calls toggleSection with the slug when toggling a checkbox on', () => {
		const toggleSection = jest.fn();

		const { getByRole } = render(
			<PDFSectionCheckboxes
				selectedSections={ [ 'summary' ] }
				toggleSection={ toggleSection }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'checkbox', { name: /^Traffic$/ } ) );

		expect( toggleSection ).toHaveBeenCalledWith( 'traffic' );
	} );

	it( 'calls toggleSection with the slug when toggling a checkbox off', () => {
		const toggleSection = jest.fn();

		const { getByRole } = render(
			<PDFSectionCheckboxes
				selectedSections={ [ 'summary', 'traffic' ] }
				toggleSection={ toggleSection }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'checkbox', { name: /^Summary$/ } ) );

		expect( toggleSection ).toHaveBeenCalledWith( 'summary' );
	} );
} );
