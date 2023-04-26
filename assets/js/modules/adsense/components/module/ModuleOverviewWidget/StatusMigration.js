/**
 * ModuleOverviewWidget - StatusMigration component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { API_STATE_READY, MODULES_ADSENSE } from '../../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../../util/status';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../../components/SettingsNotice';
import { __ } from '@wordpress/i18n';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
const { useDispatch, useSelect } = Data;

export default function StatusMigration() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const afcClient = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAFCClient( accountID )
	);
	const site = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getCurrentSite( accountID )
	);

	const adminReauthURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdminReauthURL()
	);
	const isNavigatingTo = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigatingTo( adminReauthURL )
	);

	const {
		setAccountStatus,
		setSiteStatus,
		setAccountSetupComplete,
		setSiteSetupComplete,
	} = useDispatch( MODULES_ADSENSE );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	let isReady;
	if ( afcClient || site ) {
		if (
			afcClient.state !== API_STATE_READY ||
			site.state !== API_STATE_READY ||
			! site.autoAdsEnabled
		) {
			isReady = false;
		} else {
			isReady = true;
		}
	}

	useEffect( () => {
		if ( ! isReady ) {
			return;
		}

		setAccountStatus( ACCOUNT_STATUS_READY );
		setSiteStatus( SITE_STATUS_READY );
	}, [ isReady, setAccountStatus, setSiteStatus ] );

	const handleRedoSetup = async () => {
		await setAccountSetupComplete( false );
		await setSiteSetupComplete( false );
		navigateTo( adminReauthURL );
	};

	if ( isReady === undefined || isReady === true ) {
		return null;
	}

	return (
		<SettingsNotice
			type={ TYPE_WARNING }
			notice={ __(
				'You need to redo setup to complete AdSense configuration',
				'google-site-kit'
			) }
			CTA={
				<SpinnerButton
					onClick={ handleRedoSetup }
					disabled={ isNavigatingTo }
					isSaving={ isNavigatingTo }
				>
					{ __( 'Redo setup', 'google-site-kit' ) }
				</SpinnerButton>
			}
		/>
	);
}
