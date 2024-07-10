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
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
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
import NeedsAttention from './NeedsAttention';
import GettingReady from './GettingReady';
import RequiresReview from './RequiresReview';
import Ready from './Ready';
import ErrorText from '../../../../../components/ErrorText';

export default function SetupAccountSite( { site, finishSetup } ) {
	const { autoAdsEnabled, state } = site;
	const { setSiteStatus } = useDispatch( MODULES_ADSENSE );

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

	switch ( state ) {
		case API_STATE_NEEDS_ATTENTION:
			return <NeedsAttention />;
		case API_STATE_REQUIRES_REVIEW:
			return <RequiresReview />;
		case API_STATE_GETTING_READY:
			return <GettingReady />;
		case API_STATE_READY:
			return <Ready site={ site } finishSetup={ finishSetup } />;
		default:
			return (
				<ErrorText
					message={ sprintf(
						/* translators: %s: invalid site state identifier */
						__( 'Invalid site state %s', 'google-site-kit' ),
						state
					) }
				/>
			);
	}
}

SetupAccountSite.propTypes = {
	site: PropTypes.shape( {
		autoAdsEnabled: PropTypes.bool,
		state: PropTypes.string,
	} ).isRequired,
	finishSetup: PropTypes.func,
};
