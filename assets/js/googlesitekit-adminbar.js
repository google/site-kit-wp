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
import { once } from 'lodash';

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
import {
	VIEW_CONTEXT_ADMIN_BAR,
	VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
} from './googlesitekit/constants';

// Initialize the whole adminbar app.
const init = once( () => {
	const renderTarget = document.getElementById(
		'js-googlesitekit-adminbar-modules'
	);

	if ( renderTarget ) {
		const { viewOnly } = renderTarget.dataset;

		const viewContext = viewOnly
			? VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY
			: VIEW_CONTEXT_ADMIN_BAR;

		render(
			<Root viewContext={ viewContext }>
				<AdminBarApp />
			</Root>,
			renderTarget
		);

		trackEvent( VIEW_CONTEXT_ADMIN_BAR, 'view_urlsummary' );
	}
} );

domReady( () => {
	const siteKitMenuItemEl = document.getElementById(
		'wp-admin-bar-google-site-kit'
	);

	if ( ! siteKitMenuItemEl ) {
		return;
	}

	siteKitMenuItemEl.addEventListener( 'mouseover', init, { once: true } );
	siteKitMenuItemEl.addEventListener( 'focusin', init, { once: true } );
} );
