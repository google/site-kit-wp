/**
 * AuthError component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import BannerNotification from './BannerNotification';

export default function AuthError() {
	const error = useSelect( ( select ) => select( CORE_USER ).getAuthError() );
	if ( ! error ) {
		return null;
	}

	return (
		<BannerNotification
			id="autherror"
			title={ __(
				'Site Kit can’t access necessary data',
				'google-site-kit'
			) }
			description={ error.message }
			ctaLink={ error.data.reconnectURL }
			ctaLabel={ __( 'Redo the plugin setup', 'google-site-kit' ) }
		/>
	);
}
