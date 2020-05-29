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
import Data from 'googlesitekit-data';
import Notification from '../notifications/notification';
import { parseUnsatisfiedScopes, getModulesData } from '../../util';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

const DashboardAuthAlert = () => {
	const unsatisfiedScopes = useSelect( ( select ) => select( CORE_USER ).getUnsatisfiedScopes() );
	const connectURL = useSelect( ( select ) => select( CORE_USER ).getConnectURL() );

	if ( unsatisfiedScopes === undefined || connectURL === undefined ) {
		return null;
	}

	let message = '';
	const missingScopes = parseUnsatisfiedScopes( unsatisfiedScopes );
	const moduleData = getModulesData();
	const moduleNames = missingScopes.map( ( scope ) => {
		if ( moduleData[ scope[ 0 ] ] ) {
			return moduleData[ scope[ 0 ] ].name;
		}
		return __( 'Generic', 'google-site-kit' );
	} );

	if ( 1 < moduleNames.length ) {
		/* translators: used between list items, there is a space after the comma. */
		const listSeparator = __( ', ', 'google-site-kit' );
		message = sprintf(
			/* translators: %s: Product name */
			__( 'Site Kit can’t access the some relevant data because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup for: %s – make sure to approve all permissions at the authentication stage.', 'google-site-kit' ),
			moduleNames.join( listSeparator )
		);
	} else if ( moduleNames.length === 1 ) {
		message = sprintf(
			/* translators: %1$s: Product name */
			__( 'Site Kit can’t access the relevant data from %1$s because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup for %1$s – make sure to approve all permissions at the authentication stage.', 'google-site-kit' ),
			moduleNames[ 0 ]
		);
	} else {
		// Generic error message here.
		message = __( 'Site Kit can’t access all relevant data because you haven’t granted all permissions requested during setup. Please redo setup.', 'google-site-kit' );
	}

	return (
		<Notification
			id="authentication error"
			title={ __( 'Site Kit can’t access necessary data', 'google-site-kit' ) }

			description={ message }
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
