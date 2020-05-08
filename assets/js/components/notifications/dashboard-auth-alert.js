/**
 * DashboardAuthAlert component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notification from '../notifications/notification';

const DashboardAuthAlert = () => {
	const { admin: { connectURL } } = global.googlesitekit;
	const { currentAdminPage } = global.googlesitekit.admin;
	const product = currentAdminPage.replace( /googlesitekit|module|-/g, ' ' ).replace( /(^\w{1})|(\s{1}\w{1})/g, ( match ) => match.toUpperCase() ).trim();

	return (
		<Notification
			id="authentication error"
			title={ __( "Site Kit can't access necessary data", 'google-site-kit' ) }
			/* translators: %1$s: Product name */
			description={ sprintf( __( "Site Kit can't access the relevant data from %1$s because you haven't granted all API scopes requested during setup. To use Site Kit, you'll need to redo the setup for %1$s – make sure to approve all API scopes at the authentication stage. ", 'google-site-kit' ), product ) }
			handleDismiss={ () => {} }
			format="small"
			type="win-error"
			isDismissable={ true }
			ctaLink={ connectURL }
			ctaLabel={ __( 'Redo setup', 'google-site-kit' ) }
		/>
	);
};

export default DashboardAuthAlert;
