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
import { MODULES_ADSENSE } from '../../../datastore/constants';
import {
	SITE_STATUS_NEEDS_ATTENTION,
	SITE_STATUS_REQUIRES_REVIEW,
	SITE_STATUS_GETTING_READY,
	SITE_STATUS_READY,
	SITE_STATUS_READY_NO_AUTO_ADS,
} from '../../../util/status';
const { useSelect, useDispatch } = Data;

export default function SetupAccountSite( { accountID, site, finishSetup } ) {
	const { domain, state } = site;
	const {
		setSiteStatus,
		completeAccountSetup,
		completeSiteSetup,
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
		if ( successSiteSetupCompletion && successAccountSetupCompletion ) {
			finishSetup();
		}
	}, [
		isDoingSubmitChanges,
		finishSetup,
		completeSiteSetup,
		completeAccountSetup,
	] );

	useEffect( () => {
		if (
			state !== SITE_STATUS_NEEDS_ATTENTION ||
			state !== SITE_STATUS_REQUIRES_REVIEW ||
			state !== SITE_STATUS_GETTING_READY ||
			state !== SITE_STATUS_READY ||
			state !== SITE_STATUS_READY_NO_AUTO_ADS
		) {
			return;
		}

		setSiteStatus( state );
	}, [ setSiteStatus, state ] );

	let notice = '';
	switch ( state ) {
		case SITE_STATUS_NEEDS_ATTENTION:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) needs attention`;
			break;
		case SITE_STATUS_REQUIRES_REVIEW:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) requires review`;
			break;
		case SITE_STATUS_GETTING_READY:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) is getting ready`;
			break;
		case SITE_STATUS_READY:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) is ready, with auto ads enabled`;
			break;
		case SITE_STATUS_READY_NO_AUTO_ADS:
			notice = `TODO: UI to inform that site ${ domain } (in account ${ accountID }) is ready, with auto ads disabled`;
			break;
	}

	return (
		<div>
			{ notice }

			{ ( state === SITE_STATUS_GETTING_READY ||
				state === SITE_STATUS_READY_NO_AUTO_ADS ) && (
				<Button
					onClick={ continueHandler }
					disabled={ isDoingSubmitChanges }
				>
					{ __( 'Continue', 'google-site-kit' ) }
				</Button>
			) }
		</div>
	);
}

SetupAccountSite.propTypes = {
	accountID: PropTypes.string.isRequired,
	site: PropTypes.shape().isRequired,
	finishSetup: PropTypes.func.isRequired,
};
