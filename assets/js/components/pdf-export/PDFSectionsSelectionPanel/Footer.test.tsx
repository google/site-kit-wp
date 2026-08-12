/**
 * PDF Sections Selection Panel Footer tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CONTEXT_MAIN_DASHBOARD_TRAFFIC } from '@/js/googlesitekit/widgets/default-contexts';
import * as tracking from '@/js/util/tracking';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import Footer from './Footer';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'Footer', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'fires pdf_download_report with comma-joined context slugs when Download is clicked', () => {
		registry.dispatch( CORE_PDF ).setSelection( {
			contextSlugs: [ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
			widgetSlugs: [],
		} );

		const { getByRole } = render(
			<Footer closePanel={ () => {} } hasSelection />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Download report' } ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pdf_generation_section_selection-sidebar`,
			'pdf_download_report',
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
	} );

	it( 'does not fire pdf_download_report when Download is disabled', () => {
		const { getByRole } = render(
			<Footer closePanel={ () => {} } hasSelection={ false } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByRole( 'button', { name: 'Download report' } )
		).toBeDisabled();
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'disables the "Download report" button while a report generates', () => {
		registry.dispatch( CORE_PDF ).startExporting();

		const { getByRole } = render(
			<Footer closePanel={ () => {} } hasSelection />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByRole( 'button', { name: 'Download report' } )
		).toBeDisabled();
	} );
} );
