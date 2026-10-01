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
 * WordPress dependencies
 */
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Registry } from 'googlesitekit-data';
import { FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY } from '@/js/components/feature-discovery/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import AnalyticsIcon from '@/svg/graphics/analytics.svg';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
	within,
} from '@tests/js/test-utils';
import FeatureDetailPanel from './';

describe( 'FeatureDetailPanel', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

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
			{ slug: 'first', title: 'First feature' },
			{
				slug: 'second',
				title: 'Second feature',
				moduleSlug: MODULE_SLUG_ANALYTICS_4,
			},
		] );
	} );

	afterEach( () => {
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

			expect( getByRole( 'tabpanel', { name } ) ).toBeInTheDocument();
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

		expect(
			getByRole( 'tabpanel', { name: 'Description' } )
		).toBeInTheDocument();
	} );

	it( 'should keep the panel open during setup and close after it completes', async () => {
		provideSiteInfo( registry );
		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

		fetchMock.post( surveyTriggerEndpoint, { body: {} } );

		let finishSetup: ( value: Record< string, never > ) => void;

		const setupFeature = jest
			.spyOn(
				registry.dispatch( CORE_FEATURE_DISCOVERY ),
				'setupFeature'
			)
			.mockImplementation(
				() =>
					new Promise( ( resolve ) => {
						finishSetup = resolve;
					} )
			);

		setFeature( 'first' );

		const { getByRole, queryByRole } = render( <FeatureDetailPanel />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: 'Set up now' } ) );

		expect( setupFeature ).toHaveBeenCalledWith( 'first' );
		expect( getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getByRole( 'button', { name: 'Set up now' } ) ).toBeDisabled();

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( 'first' );

		await act( () => {
			finishSetup( {} );

			return Promise.resolve();
		} );

		expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();

		expect(
			registry
				.select( CORE_UI )
				.getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY )
		).toBe( false );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: { data: { triggerID: 'setup:feature_setup_first' } },
			} )
		);
	} );
} );
