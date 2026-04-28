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
import {
	createTestRegistry,
	fireEvent,
	render,
} from '../../../../../tests/js/test-utils';
import { PDF_SECTIONS } from '@/js/components/pdf-generation/constants';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';

describe( 'PDFSectionCheckboxes', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders a checkbox per hard-coded section with checked state from props', () => {
		const selected = [ 'summary', 'traffic' ];

		const { getByRole } = render(
			<PDFSectionCheckboxes
				selectedSections={ selected }
				onChange={ () => {} }
			/>,
			{ registry }
		);

		for ( const { slug, title } of PDF_SECTIONS ) {
			const checkbox = getByRole( 'checkbox', {
				name: new RegExp( `${ title }$` ),
			} );

			if ( selected.includes( slug ) ) {
				expect( checkbox ).toBeChecked();
			} else {
				expect( checkbox ).not.toBeChecked();
			}
		}
	} );

	it( 'calls onChange with next selection when toggling a checkbox on', () => {
		const onChange = jest.fn();

		const { getByRole } = render(
			<PDFSectionCheckboxes
				selectedSections={ [ 'summary' ] }
				onChange={ onChange }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'checkbox', { name: /^Traffic$/ } ) );

		expect( onChange ).toHaveBeenCalledWith( [ 'summary', 'traffic' ] );
	} );

	it( 'calls onChange with next selection when toggling a checkbox off', () => {
		const onChange = jest.fn();

		const { getByRole } = render(
			<PDFSectionCheckboxes
				selectedSections={ [ 'summary', 'traffic' ] }
				onChange={ onChange }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'checkbox', { name: /^Summary$/ } ) );

		expect( onChange ).toHaveBeenCalledWith( [ 'traffic' ] );
	} );
} );
