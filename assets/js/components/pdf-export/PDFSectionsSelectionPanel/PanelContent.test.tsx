/**
 * PanelContent tests.
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
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import {
	REPORT_GENERATING_NOTICE_DESCRIPTION,
	REPORT_GENERATING_NOTICE_TITLE,
} from '@/js/components/pdf-export/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	render,
	waitFor,
} from '@tests/js/test-utils';
import PanelContent from './PanelContent';

function NullComponent() {
	return null;
}

/**
 * The dashboard's order for the three test sections. The panel stores the
 * selected contexts in this order, whatever order the sections were toggled.
 */
const DASHBOARD_ORDER = [
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
];

/**
 * Registers a widget area and one PDF widget in a dashboard context, so the
 * panel shows it as a section.
 *
 * @since 1.184.0
 *
 * @param  registry    The test registry that holds the area and widget.
 * @param  contextSlug The dashboard context the area belongs to.
 * @param  areaSlug    The widget area to register in that context.
 * @param  pdfTitle    The area's PDF title, shown as the report section heading.
 * @param  widgetSlug  The widget to register in that area.
 * @param  widgetLabel The widget's label in the panel.
 * @return {void}
 */
function registerSection(
	registry: ReturnType< typeof createTestRegistry >,
	contextSlug: string,
	areaSlug: string,
	pdfTitle: string,
	widgetSlug: string,
	widgetLabel: string
) {
	const dispatch = registry.dispatch( CORE_WIDGETS );
	dispatch.registerWidgetArea( areaSlug, {
		title: pdfTitle,
		pdfTitle,
		style: 'boxes',
		priority: 1,
	} );
	dispatch.assignWidgetArea( areaSlug, contextSlug );
	dispatch.registerWidget( widgetSlug, {
		Component: NullComponent,
		priority: 1,
		pdf: {
			Component: NullComponent,
			getData: () => Promise.resolve( { data: null } ),
			label: widgetLabel,
		},
	} );
	dispatch.assignWidget( widgetSlug, areaSlug );
}

/**
 * Registers the three test sections out of order, Speed first, so a test
 * can prove the stored order follows the dashboard's order, not the
 * registration order.
 *
 * @since 1.184.0
 *
 * @param  registry The test registry that holds the sections.
 * @return {void}
 */
function registerSections( registry: ReturnType< typeof createTestRegistry > ) {
	registerSection(
		registry,
		CONTEXT_MAIN_DASHBOARD_SPEED,
		'pdfSpeedArea',
		'Speed',
		'pdfSpeed',
		'Page speed'
	);
	registerSection(
		registry,
		CONTEXT_MAIN_DASHBOARD_TRAFFIC,
		'pdfTrafficArea',
		'Traffic',
		'pdfTraffic',
		'Site traffic over time'
	);
	registerSection(
		registry,
		CONTEXT_MAIN_DASHBOARD_CONTENT,
		'pdfContentArea',
		'Content',
		'pdfContent',
		'Popular content'
	);
}

describe( 'PanelContent', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		registerSections( registry );
	} );

	/**
	 * Renders the panel with the test registry, on the main dashboard.
	 *
	 * @since 1.184.0
	 *
	 * @return The testing-library render result.
	 */
	function renderPanel() {
		return render( <PanelContent closePanel={ () => {} } />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
	}

	/**
	 * Sets the stored panel state to open.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function openPanel() {
		registry
			.dispatch( CORE_UI )
			.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
	}

	/**
	 * Sets the stored panel state to closed.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function closePanel() {
		registry
			.dispatch( CORE_UI )
			.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, false );
	}

	it( "stores the context slugs in the dashboard's own order when the panel first opens", async () => {
		const { findByRole } = renderPanel();

		await findByRole( 'checkbox', { name: /^Traffic$/ } );

		await waitFor( () => {
			expect(
				registry.select( CORE_PDF ).getSelectedContextSlugs()
			).toEqual( DASHBOARD_ORDER );
		} );
	} );

	it( "keeps the stored context slugs in the dashboard's order after a section is toggled off and back on", async () => {
		const { findByRole } = renderPanel();

		// Wait for the panel to select every section before toggling.
		await waitFor( () => {
			expect(
				registry.select( CORE_PDF ).getSelectedContextSlugs()
			).toEqual( DASHBOARD_ORDER );
		} );

		// Toggle the first section off. The two remaining contexts keep their
		// dashboard order.
		fireEvent.click(
			await findByRole( 'checkbox', { name: /^Traffic$/ } )
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_PDF ).getSelectedContextSlugs()
			).toEqual( [
				CONTEXT_MAIN_DASHBOARD_CONTENT,
				CONTEXT_MAIN_DASHBOARD_SPEED,
			] );
		} );

		// Toggle the section back on. Its context returns to its dashboard
		// position, not the end of the stored order.
		fireEvent.click(
			await findByRole( 'checkbox', { name: /^Traffic$/ } )
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_PDF ).getSelectedContextSlugs()
			).toEqual( DASHBOARD_ORDER );
		} );
	} );

	it( 'shows the "generating report" notice when the panel is open and a report is being exported', async () => {
		openPanel();
		registry.dispatch( CORE_PDF ).startExporting();

		const { findByRole, getByText } = renderPanel();

		await findByRole( 'checkbox', { name: 'Traffic' } );

		expect(
			getByText( REPORT_GENERATING_NOTICE_TITLE )
		).toBeInTheDocument();
		expect(
			getByText( REPORT_GENERATING_NOTICE_DESCRIPTION )
		).toBeInTheDocument();
	} );

	it( 'hides the "generating report" notice when the panel is closed and a report is being exported', async () => {
		closePanel();
		registry.dispatch( CORE_PDF ).startExporting();

		const { findByRole, queryByText } = renderPanel();

		await findByRole( 'checkbox', { name: 'Traffic' } );

		expect(
			queryByText( REPORT_GENERATING_NOTICE_TITLE )
		).not.toBeInTheDocument();
	} );

	it( 'does not show the "generating report" notice when the panel is open but no report is being exported', async () => {
		openPanel();

		const { findByRole, queryByText } = renderPanel();

		await findByRole( 'checkbox', { name: 'Traffic' } );

		expect(
			queryByText( REPORT_GENERATING_NOTICE_TITLE )
		).not.toBeInTheDocument();
	} );
} );
