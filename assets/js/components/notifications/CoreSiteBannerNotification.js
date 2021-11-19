/**
 * CoreSiteBannerNotification component.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import BannerNotification from './BannerNotification';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

const { useDispatch } = Data;

const CoreSiteBannerNotification = ( { notification } ) => {
	const { dismissNotification, acceptNotification } = useDispatch(
		CORE_SITE
	);

	const onCTAClick = useCallback( () => {
		acceptNotification( notification.id );
	}, [ notification.id, acceptNotification ] );
	const onDismiss = useCallback( () => {
		dismissNotification( notification.id );
	}, [ notification.id, dismissNotification ] );

	return (
		<BannerNotification
			key={ notification.id }
			id={ notification.id }
			title={ notification.title || '' }
			description={ notification.content || '' }
			learnMoreURL={ notification.learnMoreURL || '' }
			learnMoreLabel={ notification.learnMoreLabel || '' }
			ctaLink={ notification.ctaURL || '' }
			ctaLabel={ notification.ctaLabel || '' }
			ctaTarget={ notification.ctaTarget || '' }
			dismiss={
				notification.dismissLabel ||
				__( 'OK, Got it!', 'google-site-kit' )
			}
			isDismissible={ notification.dismissible }
			onCTAClick={ onCTAClick }
			onDismiss={ onDismiss }
		/>
	);
};

export default CoreSiteBannerNotification;
