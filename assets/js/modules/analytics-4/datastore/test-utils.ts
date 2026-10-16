/**
 * `modules/analytics-4` datastore test utilities.
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
import { MODULES_ANALYTICS_4 } from './constants';
import { RecentContentItem, RecentContentOptions } from './fresh-data';

/**
 * Stores the recently published posts for `getRecentContent( options )` and
 * marks it as resolved, so it renders without a request.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object}   registry      Data registry object.
 * @param {Object[]} recentContent The posts and products, newest first.
 * @param {Object}   options       The options passed to `getRecentContent()`.
 * @return {void}
 */
export function provideRecentContent(
	registry: WPDataRegistry,
	recentContent: RecentContentItem[],
	options: RecentContentOptions
) {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetRecentContent( recentContent, {
			...options,
			includeProducts: false,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getRecentContent', [ options ] );
}
