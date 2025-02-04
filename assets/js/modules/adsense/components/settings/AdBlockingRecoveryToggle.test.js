/**
 * AdBlockingRecoveryToggle component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	provideModules,
	provideSiteInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import { VIEW_CONTEXT_SETTINGS } from '../../../../googlesitekit/constants';
import * as tracking from '../../../../util/tracking';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../util';
import AdBlockingRecoveryToggle from './AdBlockingRecoveryToggle';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AdBlockingRecoveryToggle', () => {
	let registry;

	const validSettings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: false,
		accountStatus: ACCOUNT_STATUS_READY,
		siteStatus: SITE_STATUS_READY,
		adBlockingRecoverySetupStatus: '',
	};

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
		] );
		provideSiteInfo( registry );
	} );

	it( 'should not render the Ad blocking recovery toggle when Ad blocking recovery setup status is empty', () => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( validSettings );

		const { container } = render( <AdBlockingRecoveryToggle />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-settings-module__ad-blocking-recovery-toggles'
			)
		).toBeNull();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the Ad blocking recovery toggle when the conditions are met', () => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
			useAdBlockingRecoverySnippet: true,
			useAdBlockingRecoveryErrorSnippet: true,
		} );

		const { container, getByLabelText, getAllByRole } = render(
			<AdBlockingRecoveryToggle />,
			{
				registry,
			}
		);

		expect(
			container.querySelector(
				'.googlesitekit-settings-module__ad-blocking-recovery-toggles'
			)
		).not.toBeNull();

		expect( container.textContent ).toContain( 'Ad blocking recovery' );
		expect(
			getByLabelText( /Enable ad blocking recovery message/i )
		).toBeInTheDocument();

		// The Material Design switch component is represented
		// by multiple elements including a 'div' and an 'input'.
		// We loop over all these to verify that they are checked.
		const recoveryTagSwitchElements = getAllByRole( 'switch', {
			name: /Enable ad blocking recovery message/i,
		} );
		recoveryTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).toBeChecked();
		} );
		const errorProtectionTagSwitchElements = getAllByRole( 'switch', {
			name: /Enable ad blocking recovery message/i,
		} );
		errorProtectionTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).toBeChecked();
		} );
	} );

	it( 'renders the Ad Blocking Recovery tag toggle unchecked and does not render the Error Protection tag toggle', () => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
			useAdBlockingRecoverySnippet: false,
			useAdBlockingRecoveryErrorSnippet: false,
		} );

		const { getByLabelText, getAllByRole, queryByLabelText } = render(
			<AdBlockingRecoveryToggle />,
			{
				registry,
			}
		);

		expect(
			getByLabelText( /Enable ad blocking recovery message/i )
		).toBeInTheDocument();

		const recoveryTagSwitchElements = getAllByRole( 'switch', {
			name: /Enable ad blocking recovery message/i,
		} );
		recoveryTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).not.toBeChecked();
		} );

		expect(
			queryByLabelText( /Place error protection code/i )
		).not.toBeInTheDocument();
	} );

	it( 'should render the same account existing tag notice there is an existing ad blocking recovery tag for the same account', () => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
			useAdBlockingRecoverySnippet: true,
			useAdBlockingRecoveryErrorSnippet: false,
		} );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingAdBlockingRecoveryTag( validSettings.accountID );

		const { container } = render( <AdBlockingRecoveryToggle />, {
			registry,
		} );

		// Verify that the notice is rendered.
		expect(
			container.querySelector( '.googlesitekit-settings-notice__text' )
		).toHaveTextContent(
			'You’ve already enabled an ad blocking recovery message on your site. We recommend using Site Kit to manage this to get the most out of AdSense.'
		);
	} );

	it( 'should render the different account existing tag notice there is an existing ad blocking recovery tag for a different account', () => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
			useAdBlockingRecoverySnippet: true,
			useAdBlockingRecoveryErrorSnippet: false,
		} );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingAdBlockingRecoveryTag( 'pub-1234567890123456' );

		const { container } = render( <AdBlockingRecoveryToggle />, {
			registry,
		} );

		// Verify that the notice is rendered.
		expect(
			container.querySelector( '.googlesitekit-settings-notice__text' )
		).toHaveTextContent(
			'Site Kit detected Ad Blocking Recovery code for a different account pub-1234567890123456 on your site. For a better ad blocking recovery experience, you should remove Ad Blocking Recovery code that’s not linked to this AdSense account.'
		);
	} );

	it( 'should fire appropriate tracking events when toggles are clicked', () => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
			// Set the initial values to true - both toggles are enabled.
			useAdBlockingRecoverySnippet: true,
			useAdBlockingRecoveryErrorSnippet: true,
		} );

		const { getByLabelText } = render( <AdBlockingRecoveryToggle />, {
			viewContext: VIEW_CONTEXT_SETTINGS,
			registry,
		} );

		// Click the recovery tag toggle.
		fireEvent.click(
			getByLabelText( /Enable ad blocking recovery message/i )
		);

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_adsense-abr',
			'disable_tag',
			'abr_tag'
		);

		// Click the recovery tag toggle again.
		fireEvent.click(
			getByLabelText( /Enable ad blocking recovery message/i )
		);

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_adsense-abr',
			'enable_tag',
			'abr_tag'
		);

		// Click the error protection tag toggle.
		fireEvent.click( getByLabelText( /Place error protection code/i ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_adsense-abr',
			'disable_tag',
			'error_protection_tag'
		);

		// Click the error protection tag toggle again.
		fireEvent.click( getByLabelText( /Place error protection code/i ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'settings_adsense-abr',
			'enable_tag',
			'error_protection_tag'
		);
	} );
} );
