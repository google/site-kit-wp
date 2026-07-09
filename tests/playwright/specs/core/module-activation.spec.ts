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
 * Internal dependencies
 */
import { expect, test } from '../../playwright';
import { asUser, withPlugins } from '../../wordpress';

const user = asUser( 'admin' );
const plugins = withPlugins( 'proxy-auth.php' );

test.describe( 'Module activation', { annotation: [ user, plugins ] }, () => {
	test( 'should prevent non active modules to be set up', async ( {
		wp,
	} ) => {
		await wp.visitAdmin(
			'admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true'
		);

		const notice = wp.page.locator( '.googlesitekit-notice', {
			hasText:
				/The Analytics module cannot be set up as it has not been activated yet\./i,
		} );

		await expect( notice ).toBeVisible();
	} );

	test( 'should render an error message when an invalid module slug is used to setup the module', async ( {
		wp,
	} ) => {
		await wp.visitAdmin(
			'admin.php?page=googlesitekit-dashboard&slug=foo&reAuth=true'
		);

		const notice = wp.page.locator( '.googlesitekit-notice', {
			hasText: /Invalid module slug foo\./i,
		} );

		await expect( notice ).toBeVisible();
	} );
} );
