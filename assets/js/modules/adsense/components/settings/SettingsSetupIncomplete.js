/**
 * AdSense Settings Setup Incomplete component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../../../../components/link';
import { STORE_NAME } from '../../datastore/constants';
import { isPendingAccountStatus } from '../../util/status';
import { AdBlockerWarning } from '../common';
const { useSelect } = Data;

export default function SettingsSetupIncomplete() {
	const accountStatus = useSelect( ( select ) => select( STORE_NAME ).getAccountStatus() );
	const isPendingStatus = isPendingAccountStatus( accountStatus );
	const adminReauthURL = useSelect( ( select ) => select( STORE_NAME ).getAdminReauthURL() );

	return (
		<Fragment>
			<AdBlockerWarning />

			{ isPendingStatus && __( 'Site Kit has placed AdSense code on your site:', 'google-site-kit' ) }
			{ ! isPendingStatus && __( 'Setup incomplete:', 'google-site-kit' ) }
			{ ' ' }
			<Link
				className="googlesitekit-settings-module__edit-button"
				href={
					adminReauthURL
				}
				inherit
			>
				{ isPendingStatus && __( 'check module page', 'google-site-kit' ) }
				{ ! isPendingStatus && __( 'continue module setup', 'google-site-kit' ) }
			</Link>
		</Fragment>
	);
}
