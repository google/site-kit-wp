/**
 * FeatureDetailPanel tests.
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
import type { RenderResult } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Registry } from 'googlesitekit-data';
import { FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY } from '@/js/components/feature-discovery/constants';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as tracking from '@/js/util/tracking';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';
import { mockBrowserScrolling } from '@tests/js/mock-browser-utils';
import {
	surveyTriggerEndpoint,
	waitForSurveyTrigger,
} from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
	waitFor,
	within,
} from '@tests/js/test-utils';
import FeatureDetailPanel from './';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'FeatureDetailPanel', () => {
	let registry: Registry;

	mockBrowserScrolling();

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, name: 'Analytics' },
		] );

		provideModuleRegistrations( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				Icon: AnalyticsIcon,
			},
		] );

		provideFeatures( registry, [
			{
				slug: 'first',
				title: 'First feature',
				detail: {
					description: { whatIs: 'First feature description' },
					requirements: { setupList: [ 'First feature setup' ] },
					screenshots: [
						{
							src: '/first.png',
							alt: 'First feature preview',
							width: 640,
							height: 480,
						},
					],
				},
			},
			{
				slug: 'second',
				title: 'Second feature',
				detail: {
					description: { whatIs: 'Second feature description' },
				},
				moduleSlug: MODULE_SLUG_ANALYTICS_4,
			},
		] );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
		document.body.classList.remove(
			'googlesitekit-side-sheet-scroll-lock'
		);
	} );

	function setFeature( slug: string | false ) {
		act( () => {
			registry
				.dispatch( CORE_UI )
				.setValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY, slug );
		} );
	}

	it( 'should open for the selected feature and close when the flag is cleared', async () => {
		const { queryByRole, getByRole, waitForRegistry } = render(
			<FeatureDetailPanel />,
			{ registry }
		);

		expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();

		setFeature( 'first' );

		expect( getByRole( 'dialog' ) ).toBeInTheDocument();

		expect(
			getByRole( 'heading', { name: 'First feature' } )
		).toBeInTheDocument();

		expect(
			within( getByRole( 'dialog' ) ).getByText( 'Site Kit feature' )
		).toBeInTheDocument();

		setFeature( 'second' );

		await waitForRegistry();

		expect( getByRole( 'tabpanel' ) ).toHaveTextContent(
			'Second feature description'
		);

		expect(
			getByRole( 'heading', { name: 'Second feature' } )
		).toBeInTheDocument();

		expect(
			queryByRole( 'heading', { name: 'First feature' } )
		).not.toBeInTheDocument();

		expect(
			within( getByRole( 'dialog' ) ).getByText( 'Analytics' )
		).toBeInTheDocument();

		setFeature( false );

		expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should stay closed for an unregistered feature', () => {
		setFeature( 'missing' );

		const { queryByRole } = render( <FeatureDetailPanel />, { registry } );

		expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'should label its CTA with the feature-specific label rather than the card label', () => {
		provideFeatures( registry, [
			{
				slug: 'setup-flow-feature',
				title: 'Setup flow feature',
				setup: {
					type: FEATURE_SETUP_TYPES.SETUP_FLOW,
					ctaLabel: 'Set up the feature',
				},
			},
		] );

		setFeature( 'setup-flow-feature' );

		const { getByRole } = render( <FeatureDetailPanel />, { registry } );

		const dialog = within( getByRole( 'dialog' ) );

		expect(
			dialog.getByRole( 'button', { name: 'Set up the feature' } )
		).toBeInTheDocument();
		expect(
			dialog.queryByRole( 'button', { name: 'Set up now' } )
		).not.toBeInTheDocument();
	} );

	it( 'should clear the feature slug when the sheet closes', () => {
		setFeature( 'first' );

		render( <FeatureDetailPanel />, { registry } );

		fireEvent.keyDown( document, {
			key: 'Escape',
			keyCode: ESCAPE,
		} );

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( false );
	} );

	it( 'should clear the feature slug when clicking outside the panel', () => {
		setFeature( 'first' );

		render( <FeatureDetailPanel />, { registry } );

		fireEvent.mouseDown( document.body );

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( false );
	} );

	it( 'should clear the feature slug when the close button is clicked', () => {
		setFeature( 'first' );

		const { getByRole } = render( <FeatureDetailPanel />, { registry } );

		fireEvent.click( getByRole( 'button', { name: 'Close' } ) );

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( false );
	} );

	it( 'should clear the feature slug when Cancel is clicked', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		registry
			.dispatch( CORE_USER )
			.receiveInitialSiteKitVersion( '1.186.0' );

		const markFeaturesSeen = jest.spyOn(
			registry.dispatch( CORE_FEATURE_DISCOVERY ),
			'markFeaturesSeen'
		);

		const dismissFeature = jest.spyOn(
			registry.dispatch( CORE_FEATURE_DISCOVERY ),
			'dismissFeature'
		);

		const setupFeature = jest.spyOn(
			registry.dispatch( CORE_FEATURE_DISCOVERY ),
			'setupFeature'
		);

		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).isFeatureNew( 'first' )
		).toBe( true );

		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).isFeatureUnread( 'first' )
		).toBe( true );

		setFeature( 'first' );

		const { getByRole, queryByRole, waitForRegistry } = render(
			<FeatureDetailPanel />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

		await waitForRegistry();

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( false );

		expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( markFeaturesSeen ).not.toHaveBeenCalled();
		expect( dismissFeature ).not.toHaveBeenCalled();
		expect( setupFeature ).not.toHaveBeenCalled();

		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).isFeatureNew( 'first' )
		).toBe( true );

		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).isFeatureUnread( 'first' )
		).toBe( true );
	} );

	it( 'should default to the description tab when reopening', async () => {
		setFeature( 'first' );

		const { getByRole, waitForRegistry } = render( <FeatureDetailPanel />, {
			registry,
		} );

		for ( const name of [ 'Description', 'Requirements', 'Screenshots' ] ) {
			fireEvent.click( getByRole( 'tab', { name } ) );

			expect( getByRole( 'tab', { selected: true } ) ).toHaveTextContent(
				name
			);

			const panel = getByRole( 'tabpanel', { name } );

			if ( name === 'Description' ) {
				expect( panel ).toHaveTextContent(
					'First feature description'
				);
			} else if ( name === 'Requirements' ) {
				expect( panel ).toHaveTextContent( 'First feature setup' );

				expect( panel ).not.toHaveTextContent(
					'First feature description'
				);
			} else {
				expect(
					within( panel ).getByRole( 'img', {
						name: 'First feature preview',
					} )
				).toBeInTheDocument();

				expect( panel ).not.toHaveTextContent( 'First feature setup' );
			}
		}

		fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

		setFeature( 'first' );

		expect(
			getByRole( 'tabpanel', { name: 'Description' } )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'tab', { name: 'Requirements' } ) );
		fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

		setFeature( 'second' );

		await waitForRegistry();

		expect( getByRole( 'tabpanel' ) ).toHaveTextContent(
			'Second feature description'
		);

		expect(
			getByRole( 'tabpanel', { name: 'Description' } )
		).toBeInTheDocument();
	} );

	it( 'should keep the panel open during setup and close after it completes', async () => {
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );

		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

		fetchMock.post( surveyTriggerEndpoint, { body: {} } );

		let finishSetup!: ( value: Record< string, never > ) => void;

		const activation = new Promise< Record< string, never > >(
			( resolve ) => {
				finishSetup = resolve;
			}
		);

		provideFeatures( registry, [
			{
				slug: 'background',
				setup: {
					type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
					activate: () => activation,
				},
			},
		] );

		const setupFeature = jest.spyOn(
			registry.dispatch( CORE_FEATURE_DISCOVERY ),
			'setupFeature'
		);

		setFeature( 'background' );

		const { getByRole, queryByRole } = render( <FeatureDetailPanel />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: 'Set up now' } ) );

		expect( setupFeature ).toHaveBeenCalledWith( 'background' );
		expect( getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getByRole( 'button', { name: 'Set up now' } ) ).toBeDisabled();

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( 'background' );

		await act( async () => {
			finishSetup( {} );
			await setupFeature.mock.results[ 0 ].value;
		} );

		expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( false );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: { data: { triggerID: 'setup:feature_setup_background' } },
			} )
		);
	} );

	it( 'should close and open an in-place feature’s panel over the hub, as the card does', async () => {
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );

		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

		fetchMock.post( surveyTriggerEndpoint, { body: {} } );

		const setupFeature = jest.spyOn(
			registry.dispatch( CORE_FEATURE_DISCOVERY ),
			'setupFeature'
		);

		let detailPanelSlugOnOpen;

		const open = jest.fn( ( panelRegistry: Registry ) => {
			detailPanelSlugOnOpen = panelRegistry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY );

			panelRegistry
				.dispatch( CORE_UI )
				.setValue( 'testPanelOpened', true );
		} );

		provideFeatures( registry, [
			{
				slug: 'in-place',
				title: 'In-place feature',
				setup: {
					type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
					ctaLabel: 'Try it now',
					open,
				},
			},
		] );

		setFeature( 'in-place' );

		const { getByRole, queryByRole } = render( <FeatureDetailPanel />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: 'Try it now' } ) );

		await waitFor( () =>
			expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);

		expect( setupFeature ).toHaveBeenCalledWith( 'in-place' );
		expect( open ).toHaveBeenCalledTimes( 1 );

		// The detail panel was already closed when the feature's panel opened.
		expect( detailPanelSlugOnOpen ).toBe( false );
		expect( registry.select( CORE_UI ).getValue( 'testPanelOpened' ) ).toBe(
			true
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: { data: { triggerID: 'setup:feature_setup_in-place' } },
			} )
		);
	} );

	describe( 'event tracking', () => {
		const viewContext = 'testViewContext';
		const category = `${ viewContext }_feature-detail-panel`;

		it.each( [
			[
				'the header close control',
				( { getByRole }: RenderResult ) =>
					fireEvent.click( getByRole( 'button', { name: 'Close' } ) ),
			],
			[
				'Cancel',
				( { getByRole }: RenderResult ) =>
					fireEvent.click(
						getByRole( 'button', { name: 'Cancel' } )
					),
			],
			[
				'ESC',
				() =>
					fireEvent.keyDown( document, {
						key: 'Escape',
						keyCode: ESCAPE,
					} ),
			],
			[ 'a click outside', () => fireEvent.mouseDown( document.body ) ],
		] )( 'should track close_panel when closed with %s', ( _, close ) => {
			setFeature( 'first' );

			const result = render( <FeatureDetailPanel />, {
				registry,
				viewContext,
			} );

			close( result );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				category,
				'close_panel',
				'first'
			);
		} );

		it( 'should not track close_panel for a click outside while the panel is closed', () => {
			render( <FeatureDetailPanel />, { registry, viewContext } );

			fireEvent.mouseDown( document.body );

			expect( mockTrackEvent ).not.toHaveBeenCalled();
		} );

		it( 'should track tab_select with the feature slug and tab name, and nothing for the active tab', () => {
			setFeature( 'first' );

			const { getByRole } = render( <FeatureDetailPanel />, {
				registry,
				viewContext,
			} );

			fireEvent.click( getByRole( 'tab', { name: 'Description' } ) );

			expect( mockTrackEvent ).not.toHaveBeenCalled();

			for ( const [ name, tab ] of [
				[ 'Requirements', 'requirements' ],
				[ 'Screenshots', 'screenshots' ],
				[ 'Description', 'description' ],
			] ) {
				mockTrackEvent.mockClear();

				fireEvent.click( getByRole( 'tab', { name } ) );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					category,
					'tab_select',
					`first:${ tab }`
				);
			}
		} );

		it( 'should track the CTA and nothing on close after the setup completes', async () => {
			provideSiteInfo( registry );
			provideUserAuthentication( registry );
			provideUserCapabilities( registry );
			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			fetchMock.post( surveyTriggerEndpoint, { body: {} } );

			provideFeatures( registry, [
				{
					slug: 'background',
					setup: {
						type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
						activate: jest.fn().mockResolvedValue( {} ),
					},
				},
			] );

			setFeature( 'background' );

			const { getByRole, queryByRole } = render( <FeatureDetailPanel />, {
				registry,
				viewContext,
			} );

			fireEvent.click( getByRole( 'button', { name: 'Set up now' } ) );

			await waitFor( () =>
				expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument()
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				category,
				'click_setup_cta',
				'background'
			);

			await waitForSurveyTrigger();
		} );

		it( 'should track click_resume_setup_cta for a feature in progress', async () => {
			provideSiteInfo( registry );
			provideUserAuthentication( registry );
			provideUserCapabilities( registry );
			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			fetchMock.post( surveyTriggerEndpoint, { body: {} } );

			provideFeatures( registry, [
				{
					slug: 'resumable',
					setup: {
						type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
						activate: jest.fn().mockResolvedValue( {} ),
						isEnabled: () => false,
						isInProgress: () => true,
					},
				},
			] );

			setFeature( 'resumable' );

			const { getByRole, queryByRole } = render( <FeatureDetailPanel />, {
				registry,
				viewContext,
			} );

			fireEvent.click( getByRole( 'button', { name: 'Set up now' } ) );

			await waitFor( () =>
				expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument()
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				category,
				'click_resume_setup_cta',
				'resumable'
			);

			await waitForSurveyTrigger();
		} );
	} );
} );
