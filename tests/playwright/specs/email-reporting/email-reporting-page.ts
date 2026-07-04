/**
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
import { Locator, Page, expect } from '@playwright/test';

export interface VerifyPanelStateOptions {
	shouldShowCurrentSubscription?: boolean;
	expectedCheckedFrequency?: 'Weekly' | 'Monthly' | 'Quarterly';
	shouldShowSubscribeButton?: boolean;
	shouldShowUnsubscribeButton?: boolean;
	shouldShowUpdateButton?: boolean;
}

export class EmailReportingPage {
	private readonly page: Page;
	private readonly root: Locator;

	/**
	 * Constructor.
	 *
	 * @since 1.177.0
	 *
	 * @param page The page.
	 */
	constructor( page: Page ) {
		this.page = page;
		this.root = page.locator( '.googlesitekit-email-reporting-settings' );
	}

	/**
	 * Open the email reporting settings page.
	 *
	 * @since 1.177.0
	 *
	 * @return {Promise<void>} The promise that resolves when the email reporting settings page is opened.
	 */
	async openSettings() {
		await this.page.getByRole( 'button', { name: 'Account' } ).click();
		await this.page
			.getByRole( 'menuitem', { name: 'Manage email reports' } )
			.click();
	}

	/**
	 * Get the panel title.
	 *
	 * @since 1.177.0
	 *
	 * @return {Locator} The panel title.
	 */
	get panelTitle() {
		return this.root.getByRole( 'heading', {
			name: 'Email reports subscription',
		} );
	}

	/**
	 * Get the current subscription badge.
	 *
	 * @since 1.177.0
	 *
	 * @return {Locator} The current subscription badge.
	 */
	get currentSubscriptionBadge() {
		return this.root.locator(
			'.googlesitekit-frequency-selector__current-subscription'
		);
	}

	/**
	 * Get the frequency radio button.
	 *
	 * @since 1.177.0
	 *
	 * @param frequency The frequency to get the radio button for.
	 * @return          The frequency radio button.
	 */
	getFrequencyRadio( frequency: 'Weekly' | 'Monthly' | 'Quarterly' ) {
		return this.root.getByRole( 'radio', { name: frequency } );
	}

	/**
	 * Get the subscribe button.
	 *
	 * @since 1.177.0
	 *
	 * @return {Locator} The subscribe button.
	 */
	get subscribeButton() {
		return this.root.getByRole( 'button', {
			name: 'Subscribe',
			exact: true,
		} );
	}

	/**
	 * Get the unsubscribe button.
	 *
	 * @since 1.177.0
	 *
	 * @return {Locator} The unsubscribe button.
	 */
	get unsubscribeButton() {
		return this.root.getByRole( 'button', { name: 'Unsubscribe' } );
	}

	/**
	 * Get the update settings button.
	 *
	 * @since 1.177.0
	 *
	 * @return {Locator} The update settings button.
	 */
	get updateSettingsButton() {
		return this.root.getByRole( 'button', { name: 'Update settings' } );
	}

	/**
	 * Get the success notice.
	 *
	 * @since 1.177.0
	 *
	 * @return {Locator} The success notice.
	 */
	get successNotice() {
		return this.root
			.getByRole( 'status' )
			.filter( { hasText: 'successfully subscribed' } );
	}

	/**
	 * Subscribe to email reports.
	 *
	 * @since 1.177.0
	 *
	 * @return {Promise<void>} The promise that resolves when the email reports are subscribed to.
	 */
	async subscribe() {
		await this.subscribeButton.click();
	}

	/**
	 * Select the frequency for email reports.
	 *
	 * @since 1.177.0
	 *
	 * @param  frequency The frequency to select.
	 * @return {Promise<void>} The promise that resolves when the frequency is selected.
	 */
	async selectFrequency( frequency: 'Weekly' | 'Monthly' | 'Quarterly' ) {
		const radio = this.getFrequencyRadio( frequency );
		await radio.click();
	}

	/**
	 * Verify the state of the email reporting settings panel.
	 *
	 * @since 1.177.0
	 *
	 * @param  options The options to verify.
	 * @return {Promise<void>} The promise that resolves when the email reporting settings panel is verified.
	 */
	async verifyPanelState( options: VerifyPanelStateOptions = {} ) {
		const {
			shouldShowCurrentSubscription = false,
			expectedCheckedFrequency,
			shouldShowSubscribeButton = false,
			shouldShowUnsubscribeButton = false,
			shouldShowUpdateButton = false,
		} = options;

		// Panel title is visible
		await expect( this.panelTitle ).toBeVisible();

		// Current subscription badge visibility
		if ( shouldShowCurrentSubscription ) {
			await expect( this.currentSubscriptionBadge ).toBeVisible();
		} else {
			await expect( this.currentSubscriptionBadge ).not.toBeVisible();
		}

		// Frequency options are visible
		await expect( this.getFrequencyRadio( 'Weekly' ) ).toBeVisible();
		await expect( this.getFrequencyRadio( 'Monthly' ) ).toBeVisible();
		await expect( this.getFrequencyRadio( 'Quarterly' ) ).toBeVisible();

		// Check expected frequency is checked
		if ( expectedCheckedFrequency ) {
			const frequencies: ( 'Weekly' | 'Monthly' | 'Quarterly' )[] = [
				'Weekly',
				'Monthly',
				'Quarterly',
			];
			for ( const freq of frequencies ) {
				const radio = this.getFrequencyRadio( freq );
				if ( freq === expectedCheckedFrequency ) {
					await expect( radio ).toBeChecked();
				} else {
					await expect( radio ).not.toBeChecked();
				}
			}
		}

		// Button visibility
		if ( shouldShowSubscribeButton ) {
			await expect( this.subscribeButton ).toBeVisible();
		} else {
			await expect( this.subscribeButton ).not.toBeVisible();
		}

		if ( shouldShowUnsubscribeButton ) {
			await expect( this.unsubscribeButton ).toBeVisible();
		} else {
			await expect( this.unsubscribeButton ).not.toBeVisible();
		}

		if ( shouldShowUpdateButton ) {
			await expect( this.updateSettingsButton ).toBeVisible();
		} else {
			await expect( this.updateSettingsButton ).not.toBeVisible();
		}
	}

	/**
	 * Verify the subscription success notice.
	 *
	 * @since 1.177.0
	 *
	 * @return {Promise<void>} The promise that resolves when the subscription success notice is verified.
	 */
	async verifySubscriptionSuccess() {
		await expect( this.successNotice ).toBeVisible( { timeout: 10_000 } );
	}
}
