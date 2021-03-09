/**
 * Adminbar component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import once from 'lodash/once';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { trackEvent } from './util';
import Root from './components/Root';
import AdminBarApp from './components/adminbar/AdminBarApp';
import './modules';

// Initialize the whole adminbar app.
const init = once( () => {
	const renderTarget = document.getElementById( 'js-googlesitekit-adminbar-modules' );

	if ( renderTarget ) {
		render(
			<Root dataAPIContext="Adminbar">
				<AdminBarApp />
			</Root>,
			renderTarget
		);

		trackEvent( 'admin_bar', 'page_stats_view' );
	}
} );

domReady( () => {
	const siteKitMenuItemEl = document.getElementById( 'wp-admin-bar-google-site-kit' );

	if ( ! siteKitMenuItemEl ) {
		return;
	}

	siteKitMenuItemEl.addEventListener( 'mouseover', init, { once: true } );
	siteKitMenuItemEl.addEventListener( 'focusin', init, { once: true } );
} );
