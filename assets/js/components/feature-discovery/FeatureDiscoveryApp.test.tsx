/**
 * Feature Discovery App component tests.
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
 * External dependencies
 */
import { HashRouter } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { SETTINGS_DIALOG } from '@/js/components/dashboard-sharing/DashboardSharingSettings/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import {
	FEATURE_SETUP_TYPES,
	SUCCEEDED_FEATURES_UI_KEY,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import * as pendingSetupModule from '@/js/googlesitekit/feature-discovery/pending-setup';
import * as tracking from '@/js/util/tracking';
import { dismissItemEndpoint } from '@tests/js/mock-dismiss-item-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import FeatureDiscoveryApp from './FeatureDiscoveryApp';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const consumePendingSetupSpy = jest.spyOn(
	pendingSetupModule,
	'consumePendingSetup'
);

// The `core/ui` key that opens each of the existing panels mounted on the hub.
const mockPanelUIKeys: Record< string, string > = {
	DashboardSharingDialog: SETTINGS_DIALOG,
	UserSettingsSelectionPanel: USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
	PDFSectionsSelectionPanel: PDF_DOWNLOAD_PANEL_OPENED_KEY,
};

// Stands in for an existing panel, rendering only while its `core/ui` key is
// set, as the real panel opens.
function mockCreatePanel( name: string ) {
	return function MockPanel() {
		const isOpen = useSelect(
			( select: Select ) =>
				select( CORE_UI ).getValue( mockPanelUIKeys[ name ] ),
			[]
		);

		return isOpen ? <div>{ name }</div> : null;
	};
}

jest.mock( '@/js/components/dashboard-sharing/DashboardSharingDialog', () =>
	mockCreatePanel( 'DashboardSharingDialog' )
);
jest.mock( '@/js/components/email-reporting/UserSettingsSelectionPanel', () =>
	mockCreatePanel( 'UserSettingsSelectionPanel' )
);
jest.mock( '@/js/components/pdf-export/PDFSectionsSelectionPanel', () =>
	mockCreatePanel( 'PDFSectionsSelectionPanel' )
);
jest.mock(
	'@/js/components/pdf-export/PDFExportRoot',
	() =>
		function MockPDFExportRoot() {
			return <div>PDFExportRoot</div>;
		}
);
jest.mock(
	'@/js/components/notifications/SetupCTAOverlays',
	() =>
		function MockSetupCTAOverlays() {
			return <div>SetupCTAOverlays</div>;
		}
);

function provideHeader( registry: ReturnType< typeof createTestRegistry > ) {
	provideModules( registry );
	provideUserAuthentication( registry );

	registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
	registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
	fetchMock.post( dismissItemEndpoint, { body: [] } );

	// The What’s new? tab reads the user's newness state, which is left empty
	// here so that no feature is listed.
	registry.dispatch( CORE_USER ).receiveInitialSiteKitVersion( '1.186.0' );
	registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
}

describe( 'FeatureDiscoveryApp', () => {
	afterEach( () => {
		global.history.replaceState( {}, '', '/' );
		mockTrackEvent.mockClear();
	} );

	async function renderApp(
		pathname = '/whats-new',
		setupRegistry?: (
			registry: ReturnType< typeof createTestRegistry >
		) => void
	) {
		const registry = createTestRegistry();

		global.history.replaceState( {}, '', `/#${ pathname }` );

		provideHeader( registry );
		setupRegistry?.( registry );

		const result = render(
			<HashRouter>
				<FeatureDiscoveryApp />
			</HashRouter>,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		await result.waitForRegistry();

		return result;
	}

	it( 'should render the shell including header', async () => {
		const { container } = await renderApp();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should activate the correct tab for /all-services', async () => {
		const { getByRole } = await renderApp( '/all-services' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'All services and features'
		);
	} );

	it( 'should activate the correct tab for /whats-new', async () => {
		const { getByRole } = await renderApp( '/whats-new' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'What’s new?'
		);
	} );

	it( 'should update the hash and active tab when selecting each tab', async () => {
		const { getByRole } = await renderApp();

		fireEvent.click(
			getByRole( 'tab', { name: 'All services and features' } )
		);

		expect( global.location.hash ).toBe( '#/all-services' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'All services and features'
		);

		fireEvent.click( getByRole( 'tab', { name: 'What’s new?' } ) );

		expect( global.location.hash ).toBe( '#/whats-new' );

		expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
			'What’s new?'
		);
	} );

	it( 'should push tab changes to history and restore the active tab on back and forward', async () => {
		const { getByRole } = await renderApp( '/all-services' );

		const historyLength = global.history.length;

		fireEvent.click( getByRole( 'tab', { name: 'What’s new?' } ) );

		expect( global.history.length ).toBe( historyLength + 1 );

		act( () => global.history.back() );

		await waitFor( () => {
			expect( global.location.hash ).toBe( '#/all-services' );

			expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
				'All services and features'
			);
		} );

		act( () => global.history.forward() );

		await waitFor( () => {
			expect( global.location.hash ).toBe( '#/whats-new' );

			expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
				'What’s new?'
			);
		} );
	} );

	it( 'should avoid adding history entries when clicking the current tab', async () => {
		const { getByRole } = await renderApp();

		const historyLength = global.history.length;

		fireEvent.click( getByRole( 'tab', { name: 'What’s new?' } ) );

		expect( global.history.length ).toBe( historyLength );
		expect( global.location.hash ).toBe( '#/whats-new' );
	} );

	it.each( [
		[ '/whats-new', 'All services and features', 'all-services' ],
		[ '/all-services', 'What’s new?', 'whats-new' ],
	] )(
		'should track the tab_select event when selecting a tab from %s',
		async ( pathname, tabName, eventLabel ) => {
			const { getByRole, waitForRegistry } = await renderApp( pathname );

			fireEvent.click( getByRole( 'tab', { name: tabName } ) );

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_FEATURE_DISCOVERY }_navigation`,
				'tab_select',
				eventLabel
			);
		}
	);

	it( 'should mount the PDF export root', async () => {
		const { getByText } = await renderApp();

		expect( getByText( 'PDFExportRoot' ) ).toBeInTheDocument();
	} );

	it( 'should mount the hub setup-CTA overlays only once pending setup has been consumed', async () => {
		let resolveConsumePendingSetup: ( value: null ) => void;
		consumePendingSetupSpy.mockReturnValue(
			new Promise( ( resolve ) => {
				resolveConsumePendingSetup = resolve;
			} )
		);

		const registry = createTestRegistry();
		global.history.replaceState( {}, '', '/#/whats-new' );
		provideHeader( registry );

		const { queryByText } = render(
			<HashRouter>
				<FeatureDiscoveryApp />
			</HashRouter>,
			{ registry, viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY }
		);

		expect( queryByText( 'SetupCTAOverlays' ) ).not.toBeInTheDocument();

		await act( async () => {
			resolveConsumePendingSetup( null );
			// Let the resolved promise's `.then()` flush.
			await null;
		} );

		expect( queryByText( 'SetupCTAOverlays' ) ).toBeInTheDocument();

		consumePendingSetupSpy.mockRestore();
	} );

	it.each( [
		[ 'DashboardSharingDialog', SETTINGS_DIALOG ],
		[
			'UserSettingsSelectionPanel',
			USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
		],
		[ 'PDFSectionsSelectionPanel', PDF_DOWNLOAD_PANEL_OPENED_KEY ],
	] )(
		'should mount %s and open it over the hub when its UI key is set',
		async ( name, uiKey ) => {
			const { queryByText, getByText, getByRole, registry } =
				await renderApp( '/all-services' );

			expect( queryByText( name ) ).not.toBeInTheDocument();

			act( () => {
				registry.dispatch( CORE_UI ).setValue( uiKey, true );
			} );

			expect( getByText( name ) ).toBeInTheDocument();

			// The hub stays on the tab it was on.
			expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
				'All services and features'
			);

			act( () => {
				registry.dispatch( CORE_UI ).setValue( uiKey, false );
			} );

			expect( queryByText( name ) ).not.toBeInTheDocument();
		}
	);

	describe( 'success detection', () => {
		// The `core/ui` key each test feature reads its connection state from,
		// so that a test can set the feature up while the hub is mounted.
		function getConnectedKey( slug: string ) {
			return `test-connected-${ slug }`;
		}

		function provideTestFeatures(
			registry: ReturnType< typeof createTestRegistry >,
			slugs: string[]
		) {
			provideFeatures(
				registry,
				slugs.map( ( slug ) => ( {
					slug,
					title: `Feature ${ slug }`,
					setup: {
						type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
						ctaLabel: 'Set up now',
						isEnabled: ( select ) =>
							select( CORE_UI ).getValue(
								getConnectedKey( slug )
							) === true,
					},
					successNotice: { title: `Feature ${ slug } is set up` },
				} ) )
			);
		}

		function setConnected(
			registry: ReturnType< typeof createTestRegistry >,
			slug: string,
			isConnected: boolean
		) {
			act( () => {
				registry
					.dispatch( CORE_UI )
					.setValue( getConnectedKey( slug ), isConnected );
			} );
		}

		function getSucceededFeatures(
			registry: ReturnType< typeof createTestRegistry >
		) {
			return registry
				.select( CORE_UI )
				.getValue( SUCCEEDED_FEATURES_UI_KEY );
		}

		it( 'should flag a feature that becomes connected while the hub is mounted', async () => {
			const { registry } = await renderApp(
				'/all-services',
				( testRegistry ) =>
					provideTestFeatures( testRegistry, [ 'one', 'two' ] )
			);

			expect( getSucceededFeatures( registry ) ).toBeUndefined();

			setConnected( registry, 'one', true );

			expect( getSucceededFeatures( registry ) ).toEqual( [ 'one' ] );

			setConnected( registry, 'two', true );

			expect( getSucceededFeatures( registry ) ).toEqual( [
				'one',
				'two',
			] );
		} );

		it( 'should not flag a feature that is already connected when the hub loads', async () => {
			const { registry } = await renderApp(
				'/all-services',
				( testRegistry ) => {
					provideTestFeatures( testRegistry, [ 'one' ] );
					testRegistry
						.dispatch( CORE_UI )
						.setValue( getConnectedKey( 'one' ), true );
				}
			);

			expect( getSucceededFeatures( registry ) ).toBeUndefined();
		} );

		it( 'should not add a feature more than once', async () => {
			const { registry } = await renderApp(
				'/all-services',
				( testRegistry ) =>
					provideTestFeatures( testRegistry, [ 'one' ] )
			);

			setConnected( registry, 'one', true );
			setConnected( registry, 'one', false );
			setConnected( registry, 'one', true );

			expect( getSucceededFeatures( registry ) ).toEqual( [ 'one' ] );
		} );

		it( 'should show the success notice in place of the card, and drop the feature once dismissed', async () => {
			const { registry, getByRole, getByText, queryByText } =
				await renderApp( '/all-services', ( testRegistry ) =>
					provideTestFeatures( testRegistry, [ 'one' ] )
				);

			expect( getByText( 'Feature one' ) ).toBeInTheDocument();

			setConnected( registry, 'one', true );

			await waitFor( () => {
				expect(
					getByText( 'Feature one is set up' )
				).toBeInTheDocument();
			} );
			expect( queryByText( 'Feature one' ) ).not.toBeInTheDocument();

			fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

			expect(
				queryByText( 'Feature one is set up' )
			).not.toBeInTheDocument();
			expect( getSucceededFeatures( registry ) ).toEqual( [] );
		} );
	} );
} );
