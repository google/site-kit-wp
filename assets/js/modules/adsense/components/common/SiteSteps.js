/**
 * AdSense Site Steps component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../../../../components/link';
import ProgressBar from '../../../../components/progress-bar';
import {
	getAccountSiteURL,
	getAccountSiteAdsPreviewURL,
} from '../../util/url';
import { STORE_NAME } from '../../datastore';
import { STORE_NAME as siteStoreName } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as userStoreName } from '../../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

export default function SiteSteps() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const siteURL = useSelect( ( select ) => select( siteStoreName ).getReferenceSiteURL() );
	const userEmail = useSelect( ( select ) => select( userStoreName ).getEmail() );

	if ( ! accountID || ! siteURL || ! userEmail ) {
		return <ProgressBar small />;
	}

	const enableAutoAdsURL = getAccountSiteAdsPreviewURL( { accountID, siteURL, userEmail } );
	// Site status is only displayed in sites list view, so do not pass siteURL here.
	const siteStatusURL = getAccountSiteURL( { accountID, userEmail } );

	const steps = [
		{
			linkText: __( 'Enabled auto ads for your site', 'google-site-kit' ),
			linkURL: enableAutoAdsURL,
		},
		{
			linkText: __( 'Verified that your site is marked as "Ready"', 'google-site-kit' ),
			linkURL: siteStatusURL,
		},
	];

	return (
		<div className="googlesitekit-setup-module__list-wrapper">
			<ol className="googlesitekit-setup-module__list">
				{ steps.map( ( item, index ) => (
					<li
						className="googlesitekit-setup-module__list-item"
						key={ index }
					>
						<Link
							href={ item.linkURL }
							external
							inherit
						>
							{ item.linkText }
						</Link>
					</li>
				) ) }
			</ol>
		</div>
	);
}
