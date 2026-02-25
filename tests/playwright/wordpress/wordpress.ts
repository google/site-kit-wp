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
import { Response, test } from '@playwright/test';

/**
 * Internal dependencies
 */
import { WordPressCore } from './core';

/**
 * Represents a WordPress instance.
 *
 * @since n.e.x.t
 */
export class WordPress extends WordPressCore {
	/**
	 * Navigates to the given path.
	 *
	 * @since n.e.x.t
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	goto( path: string ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }${ path }` );
	}

	/**
	 * Navigates to the given path in the admin area.
	 *
	 * @since n.e.x.t
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	visitAdmin( path = '' ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }/wp-admin/${ path }` );
	}

	/**
	 * Navigates to the given path in the frontend.
	 *
	 * @since n.e.x.t
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	visitFrontend( path = '/' ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }${ path }` );
	}

	/**
	 * Activates a plugin in WordPress.
	 *
	 * @since n.e.x.t
	 *
	 * @param  slug The slug of the plugin to activate.
	 * @return {Promise<void>} A promise that resolves when the plugin is activated.
	 */
	async activatePlugin( slug: string ): Promise< void > {
		await test.step( `Activate plugin: ${ slug }`, async () => {
			await this.visitAdmin( 'plugins.php' );
			const activateLink = this.page.locator(
				`tr[data-slug="${ slug }"] .activate a`
			);
			if ( await activateLink.isVisible() ) {
				await activateLink.click();
				await this.page.waitForLoadState( 'domcontentloaded' );
			}
		} );
	}

	/**
	 * Deactivates a plugin in WordPress.
	 *
	 * @since n.e.x.t
	 *
	 * @param  slug The slug of the plugin to deactivate.
	 * @return {Promise<void>} A promise that resolves when the plugin is deactivated.
	 */
	async deactivatePlugin( slug: string ): Promise< void > {
		await test.step( `Deactivate plugin: ${ slug }`, async () => {
			await this.visitAdmin( 'plugins.php' );
			const deactivateLink = this.page.locator(
				`tr[data-slug="${ slug }"] .deactivate a`
			);
			if ( await deactivateLink.isVisible() ) {
				await deactivateLink.click();
				await this.page.waitForURL( /plugins\.php/ );
			}
		} );
	}
}
