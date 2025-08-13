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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
import { Cell, Grid, Row } from '../../../../../material-components/layout';
import { API_STATE_READY, MODULES_ADSENSE } from '../../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../../util/status';
import Notice from '../../../../../components/Notice';

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
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);

	const {
		setAccountStatus,
		setSiteStatus,
		setAccountSetupComplete,
		setSiteSetupComplete,
		saveSettings,
	} = useDispatch( MODULES_ADSENSE );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	let isReady;
	if ( afcClient && site ) {
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
		if ( isReady ) {
			( async () => {
				await setAccountStatus( ACCOUNT_STATUS_READY );
				await setSiteStatus( SITE_STATUS_READY );
				await saveSettings();
			} )();
		}
	}, [ isReady, saveSettings, setAccountStatus, setSiteStatus ] );

	async function handleRedoSetup() {
		await setAccountSetupComplete( false );
		await setSiteSetupComplete( false );
		await saveSettings();
		navigateTo( adminReauthURL );
	}

	if ( isReady === true ) {
		return null;
	}

	return (
		<Grid>
			<Row>
				<Cell size={ 12 }>
					{ isReady === undefined && <ProgressBar /> }
					{ isReady === false && (
						<Notice
							type={ Notice.TYPES.WARNING }
							description={ __(
								'You need to redo setup to complete AdSense configuration',
								'google-site-kit'
							) }
							ctaButton={ {
								label: __( 'Redo setup', 'google-site-kit' ),
								onClick: handleRedoSetup,
								disabled: isNavigating,
								inProgress: isNavigating,
							} }
						/>
					) }
				</Cell>
			</Row>
		</Grid>
	);
}
