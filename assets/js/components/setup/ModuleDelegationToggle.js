/**
 * ModuleDelegationToggle component.
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
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import Radio from '../Radio';
const { useSelect } = Data;

export default function ModuleDelegationToggle( { module } ) {
	const currentUserID = useSelect( ( select ) => select( CORE_USER ).getID() );

	const [ delegatedAccess, setDelegatedAccess ] = useState( true );
	const toggleDelegateAccess = useCallback( async ( e ) => {
		setDelegatedAccess( e.target.value === 'owner' );
	}, [ setDelegatedAccess ] );

	if ( ! currentUserID ) {
		return null;
	}

	// Once the module is connected, only the module owner can change these settings.
	// Or if there is no module owner, it is irrelevant for this module.
	if ( module.connected && ( ! module.owner || module.owner.id !== currentUserID ) ) {
		return null;
	}

	return (
		<fieldset className="googlesitekit-module-delegation">
			<legend className="googlesitekit-module-delegation__text">
				{ __( 'Delegated data access', 'google-site-kit' ) }
			</legend>
			<div className="googlesitekit-module-delegation__toggles">
				<div className="googlesitekit-module-delegation__toggle">
					<Radio
						id="delegated-module-access"
						name="delegated-module-access"
						value="owner"
						checked={ delegatedAccess }
						onClick={ toggleDelegateAccess }
					>
						{ __( 'Delegate my credentials', 'google-site-kit' ) }
						<span className="googlesitekit-module-delegation__description">
							{ sprintf(
								/* translators: %s: module name */
								__( 'Allows other users in your site to view %s data on your behalf', 'google-site-kit' ),
								module.name,
							) }
						</span>
					</Radio>
				</div>
				<div className="googlesitekit-module-delegation__toggle">
					<Radio
						id="delegated-module-access"
						name="delegated-module-access"
						value="viewer"
						checked={ ! delegatedAccess }
						onClick={ toggleDelegateAccess }
					>
						{ __( 'Do not delegate my credentials', 'google-site-kit' ) }
						<span className="googlesitekit-module-delegation__description">
							{ sprintf(
								/* translators: %s: module name */
								__( 'No other users will be able to view %s data on your behalf, effectively restricting it to only administrators', 'google-site-kit' ),
								module.name,
							) }
						</span>
					</Radio>
				</div>
			</div>
		</fieldset>
	);
}
