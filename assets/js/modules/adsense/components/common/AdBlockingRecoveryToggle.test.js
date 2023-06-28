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
import AdBlockingRecoveryToggle from './AdBlockingRecoveryToggle';
import {
	render,
	provideModules,
	fireEvent,
} from '../../../../../../tests/js/test-utils';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../util';

describe( 'AdBlockingRecoveryToggle', () => {
	const validSettings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: false,
		accountStatus: ACCOUNT_STATUS_READY,
		siteStatus: SITE_STATUS_READY,
		adBlockingRecoverySetupStatus: '',
	};

	it( 'should not render the Ad blocking recovery toggle when Ad blocker recovery setup status is empty', () => {
		const { container } = render( <AdBlockingRecoveryToggle />, {
			setupRegistry: ( registry ) => {
				provideModules( registry, [
					{
						slug: 'adsense',
						active: true,
						connected: true,
					},
				] );
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetSettings( validSettings );
			},
		} );

		expect(
			container.querySelector(
				'.googlesitekit-settings-module__ad-blocking-recovery-toggles'
			)
		).toBeNull();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the Ad blocking recovery toggle when the conditions are met', () => {
		const { container, getByLabelText, getAllByRole } = render(
			<AdBlockingRecoveryToggle />,
			{
				setupRegistry: ( registry ) => {
					provideModules( registry, [
						{
							slug: 'adsense',
							active: true,
							connected: true,
						},
					] );
					registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
						...validSettings,
						adBlockingRecoverySetupStatus:
							ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
						useAdBlockingRecoverySnippet: true,
						useAdBlockingRecoveryErrorSnippet: true,
					} );
				},
			}
		);

		expect(
			container.querySelector(
				'.googlesitekit-settings-module__ad-blocking-recovery-toggles'
			)
		).not.toBeNull();

		expect( container.textContent ).toContain( 'Ad blocking recovery' );
		expect(
			getByLabelText( /Place ad blocking recovery tag/i )
		).toBeInTheDocument();

		// The Material Design switch component is represented
		// by multiple elements including a 'div' and an 'input'.
		// We loop over all these to verify that they are checked.
		const recoveryTagSwitchElements = getAllByRole( 'switch', {
			name: /place ad blocking recovery tag/i,
		} );
		recoveryTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).toBeChecked();
		} );
		const errorProtectionTagSwitchElements = getAllByRole( 'switch', {
			name: /place error protection tag/i,
		} );
		errorProtectionTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).toBeChecked();
		} );
	} );

	it( 'renders the Ad Blocking Recovery tag toggle unchecked and does not render the Error Protection tag toggle', () => {
		const { getByLabelText, getAllByRole, queryByLabelText } = render(
			<AdBlockingRecoveryToggle />,
			{
				setupRegistry: ( registry ) => {
					provideModules( registry, [
						{
							slug: 'adsense',
							active: true,
							connected: true,
						},
					] );
					registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
						...validSettings,
						adBlockingRecoverySetupStatus:
							ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
						useAdBlockingRecoverySnippet: false,
						useAdBlockingRecoveryErrorSnippet: false,
					} );
				},
			}
		);

		expect(
			getByLabelText( /Place ad blocking recovery tag/i )
		).toBeInTheDocument();

		const recoveryTagSwitchElements = getAllByRole( 'switch', {
			name: /place ad blocking recovery tag/i,
		} );
		recoveryTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).not.toBeChecked();
		} );

		expect(
			queryByLabelText( /Place error protection tag/i )
		).not.toBeInTheDocument();
	} );

	it( 'should render the notice when the user unchecks the ad blocking recovery tag toggle', () => {
		const { getByLabelText, getAllByRole, container } = render(
			<AdBlockingRecoveryToggle />,
			{
				setupRegistry: ( registry ) => {
					provideModules( registry, [
						{
							slug: 'adsense',
							active: true,
							connected: true,
						},
					] );
					registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
						...validSettings,
						adBlockingRecoverySetupStatus:
							ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
						useAdBlockingRecoverySnippet: true,
						useAdBlockingRecoveryErrorSnippet: false,
					} );
				},
			}
		);

		expect(
			getByLabelText( /Place ad blocking recovery tag/i )
		).toBeInTheDocument();

		const recoveryTagSwitchElements = getAllByRole( 'switch', {
			name: /place ad blocking recovery tag/i,
		} );
		// Verify that the switch is checked initially.
		recoveryTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).toBeChecked();
		} );
		// Verify that the notice is not rendered.
		expect(
			container.querySelector( '.googlesitekit-settings-notice' )
		).not.toBeInTheDocument();

		// Uncheck the switch.
		fireEvent.click( container.querySelector( '.mdc-switch' ) );

		// Verify that the switch is unchecked.
		recoveryTagSwitchElements.forEach( ( switchEl ) => {
			expect( switchEl ).not.toBeChecked();
		} );

		// Verify that the notice is rendered.
		expect(
			container.querySelector( '.googlesitekit-settings-notice__text' )
		).toHaveTextContent(
			'The ad blocking recovery message won’t be displayed to visitors unless the tag is placed'
		);
	} );
} );
