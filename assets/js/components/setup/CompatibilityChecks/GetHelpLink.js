/**
 * GetHelpLink component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../../Link';
const { useSelect } = Data;
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	ERROR_AMP_CDN_RESTRICTED,
	ERROR_API_UNAVAILABLE,
	ERROR_GOOGLE_API_CONNECTION_FAIL,
	ERROR_TOKEN_MISMATCH,
} from './constants';

const errorCodes = {
	[ ERROR_AMP_CDN_RESTRICTED ]: 'amp_cdn_restricted',
	[ ERROR_API_UNAVAILABLE ]: 'check_api_unavailable',
	[ ERROR_GOOGLE_API_CONNECTION_FAIL ]: 'google_api_connection_fail',
	[ ERROR_TOKEN_MISMATCH ]: 'setup_token_mismatch',
};

export default function GetHelpLink( { errorCode } ) {
	const getHelpLinkURL = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: errorCodes[ errorCode ],
		} )
	);

	if ( ! getHelpLinkURL ) {
		return null;
	}

	return (
		<Link href={ getHelpLinkURL } external>
			{ __( 'Get help', 'google-site-kit' ) }
		</Link>
	);
}

GetHelpLink.propTypes = {
	errorCode: PropTypes.string.isRequired,
};
