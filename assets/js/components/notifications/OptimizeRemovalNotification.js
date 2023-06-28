/**
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import BannerNotification, { LEARN_MORE_TARGET } from './BannerNotification';
const { useSelect, useDispatch } = Data;

export default function OptimizeRemovalNotification() {
	const bannerID = 'optimize-removal-notification';

	const connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'optimize' )
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( bannerID )
	);

	const learnMore = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/optimize/answer/12979939',
		} )
	);

	const { dismissItem } = useDispatch( CORE_USER );
	const onDismiss = () => {
		dismissItem( bannerID );
	};

	if ( ! connected || isDismissed || undefined === isDismissed ) {
		return null;
	}

	return (
		<BannerNotification
			id={ bannerID }
			title={ __(
				'Google Optimize will no longer work after September 30, 2023',
				'google-site-kit'
			) }
			description={ __(
				'Google Optimize and Optimize 360 will no longer be available after September 30, 2023 and will be removed in future versions of Site Kit after this date.',
				'google-site-kit'
			) }
			ctaLabel={ __( 'OK, Got it!', 'google-site-kit' ) }
			ctaLink="#"
			onCTAClick={ onDismiss }
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreTarget={ LEARN_MORE_TARGET.EXTERNAL }
			learnMoreURL={ learnMore }
		/>
	);
}
