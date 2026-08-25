/**
 * SubscribeActions component tests.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { act, createTestRegistry, render } from '@tests/js/test-utils';
import SubscribeActions from './SubscribeActions';

describe( 'SubscribeActions', () => {
	let registry: WPDataRegistry;

	/**
	 * Renders `SubscribeActions` with the email reporting settings a test needs.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}  [options]                  Optional. What the test renders with.
	 * @param {boolean} [options.isSubscribed]     Optional. Whether the user is subscribed to email reports. Defaults to `false`.
	 * @param {string}  [options.savedFrequency]   Optional. The frequency the subscription already uses, one of `EMAIL_REPORT_FREQUENCIES`. Defaults to `weekly`.
	 * @param {boolean} [options.isSavingSettings] Optional. Whether a save is in progress. Defaults to `false`.
	 * @return {Object} The render result.
	 */
	function renderSubscribeActions( {
		isSubscribed = false,
		savedFrequency = 'weekly',
		isSavingSettings = false,
	} = {} ) {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );

		// `receiveGetEmailReportingSettings` writes the same values to both
		// `settings` and `savedSettings`. A test that never calls
		// `selectFrequency` therefore starts with the settings unchanged.
		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: isSubscribed,
			frequency: savedFrequency,
		} );

		return render(
			<SubscribeActions
				isSubscribed={ isSubscribed }
				isSavingSettings={ isSavingSettings }
				onSubscribe={ jest.fn() }
				onUnsubscribe={ jest.fn() }
				updateSettings={ jest.fn() }
			/>,
			{ registry }
		);
	}

	/**
	 * Picks a frequency through the store, the way `FrequencySelector` does.
	 *
	 * `SubscribeActions` renders no frequency card, so a test has none to click.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} frequency The frequency to pick, one of `EMAIL_REPORT_FREQUENCIES`.
	 * @return {void}
	 */
	function selectFrequency( frequency: string ) {
		act( () => {
			registry
				.dispatch( CORE_USER )
				.setEmailReportingFrequency( frequency );
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'disables the "Update Settings" button while the selected frequency matches the saved frequency', () => {
		const { getByRole } = renderSubscribeActions( {
			isSubscribed: true,
			savedFrequency: 'weekly',
		} );

		expect(
			getByRole( 'button', { name: 'Update Settings' } )
		).toBeDisabled();
	} );

	it( 'enables the "Update Settings" button when the user picks a different frequency', () => {
		const { getByRole } = renderSubscribeActions( {
			isSubscribed: true,
			savedFrequency: 'weekly',
		} );

		selectFrequency( 'monthly' );

		expect(
			getByRole( 'button', { name: 'Update Settings' } )
		).toBeEnabled();
	} );

	it( 'disables the "Update Settings" button when the user goes back to the saved frequency', () => {
		const { getByRole } = renderSubscribeActions( {
			isSubscribed: true,
			savedFrequency: 'weekly',
		} );

		selectFrequency( 'monthly' );
		selectFrequency( 'weekly' );

		expect(
			getByRole( 'button', { name: 'Update Settings' } )
		).toBeDisabled();
	} );

	it( 'enables the "Subscribe" button while the selected frequency matches the saved frequency', () => {
		const { getByRole } = renderSubscribeActions( {
			isSubscribed: false,
		} );

		expect( getByRole( 'button', { name: 'Subscribe' } ) ).toBeEnabled();
	} );

	it( 'disables the "Update Settings" button while a save is in progress, even when the user picks a different frequency', () => {
		const { getByRole } = renderSubscribeActions( {
			isSubscribed: true,
			savedFrequency: 'weekly',
			isSavingSettings: true,
		} );

		selectFrequency( 'monthly' );

		expect(
			getByRole( 'button', { name: 'Update Settings' } )
		).toBeDisabled();
	} );

	it( 'disables the "Subscribe" button while a save is in progress', () => {
		const { getByRole } = renderSubscribeActions( {
			isSubscribed: false,
			isSavingSettings: true,
		} );

		expect( getByRole( 'button', { name: 'Subscribe' } ) ).toBeDisabled();
	} );
} );
