/**
 * SIgn In With Google Setup form.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import ClientIDTextField from '../common/ClientIDTextField';
import Button from '../../../../googlesitekit/components-gm2/Button';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import ExternalIcon from '../../../../../svg/icons/external.svg';

export default function SetupForm() {
	const siteName = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteName()
	);
	const homeURL = useSelect( ( select ) => select( CORE_SITE ).getHomeURL() );

	return (
		<form>
			<StoreErrorNotices
				moduleSlug={ MODULES_SIGN_IN_WITH_GOOGLE }
				storeName={ MODULES_SIGN_IN_WITH_GOOGLE }
			/>
			<p className="googlesitekit-margin-bottom-0">
				{ __(
					'Add your client ID here to complete setup:',
					'google-site-kit'
				) }
			</p>
			<div className="googlesitekit-setup-module__inputs">
				<ClientIDTextField />
			</div>
			<Button
				className="googlesitekit-sign-in-with-google-client-id-cta"
				href={ `https://developers.google.com/web/site-kit?sitename=${ encodeURIComponent(
					siteName
				) }&siteurl=${ encodeURIComponent( homeURL ) }` }
				target="_blank"
				trailingIcon={ <ExternalIcon width="15" height="15" /> }
				inverse
			>
				{ __( 'Get your client ID', 'google-site-kit' ) }
			</Button>
		</form>
	);
}
