/**
 * SetupAccountSite component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../../../../../components/Button';
import {
	MODULES_ADSENSE,
	API_STATE_READY,
	API_STATE_GETTING_READY,
	API_STATE_NEEDS_ATTENTION,
	API_STATE_REQUIRES_REVIEW,
} from '../../../datastore/constants';
import {
	SITE_STATUS_READY,
	SITE_STATUS_GETTING_READY,
	SITE_STATUS_NEEDS_ATTENTION,
	SITE_STATUS_REQUIRES_REVIEW,
	SITE_STATUS_READY_NO_AUTO_ADS,
} from '../../../util/status';
const { useSelect, useDispatch } = Data;

export default function SetupAccountSite( { accountID, site, finishSetup } ) {
	const { autoAdsEnabled, domain, state } = site;
	const {
		setSiteStatus,
		completeSiteSetup,
		completeAccountSetup,
	} = useDispatch( MODULES_ADSENSE );

	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isDoingSubmitChanges()
	);

	const continueHandler = useCallback( async () => {
		if ( isDoingSubmitChanges ) {
			return;
		}

		const successSiteSetupCompletion = await completeSiteSetup();
		const successAccountSetupCompletion = await completeAccountSetup();
		if (
			successSiteSetupCompletion &&
			successAccountSetupCompletion &&
			typeof finishSetup === 'function'
		) {
			finishSetup();
		}
	}, [
		isDoingSubmitChanges,
		finishSetup,
		completeSiteSetup,
		completeAccountSetup,
	] );

	useEffect( () => {
		let siteStatus;

		switch ( state ) {
			case API_STATE_NEEDS_ATTENTION:
				siteStatus = SITE_STATUS_NEEDS_ATTENTION;
				break;
			case API_STATE_REQUIRES_REVIEW:
				siteStatus = SITE_STATUS_REQUIRES_REVIEW;
				break;
			case API_STATE_GETTING_READY:
				siteStatus = SITE_STATUS_GETTING_READY;
				break;
			case API_STATE_READY:
				siteStatus = autoAdsEnabled
					? SITE_STATUS_READY
					: SITE_STATUS_READY_NO_AUTO_ADS;
				break;
		}

		if ( siteStatus ) {
			setSiteStatus( siteStatus );
		}
	}, [ autoAdsEnabled, setSiteStatus, state ] );

	let notice;
	switch ( state ) {
		case API_STATE_NEEDS_ATTENTION:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) needs attention`;
			break;
		case API_STATE_REQUIRES_REVIEW:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) requires review`;
			break;
		case API_STATE_GETTING_READY:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) is getting ready`;
			break;
		case API_STATE_READY:
			notice = autoAdsEnabled
				? `TODO: UI to inform that site ${ domain } (in account ${ accountID }) is ready, with auto ads enabled`
				: `TODO: UI to inform that site ${ domain } (in account ${ accountID }) is ready, with auto ads disabled`;
			break;
	}

	return (
		<div>
			<p>{ notice }</p>

			{ state === API_STATE_READY && (
				<div>
					<Button
						onClick={ continueHandler }
						disabled={ isDoingSubmitChanges }
					>
						{ __( 'Continue', 'google-site-kit' ) }
					</Button>
				</div>
			) }
		</div>
	);
}

SetupAccountSite.propTypes = {
	accountID: PropTypes.string.isRequired,
	site: PropTypes.shape( {
		autoAdsEnabled: PropTypes.bool,
		domain: PropTypes.string,
		state: PropTypes.string,
	} ).isRequired,
	finishSetup: PropTypes.func,
};
