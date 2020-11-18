/**
 * UserInputSettings component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { useInstanceId as useInstanceID } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Notification from './notification';
import { getTimeInSeconds } from '../../util';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import personSitImage from '../../../images/person-sit.png';
const { useSelect } = Data;

export default function UserInputSettings() {
	const instanceID = useInstanceID( UserInputSettings );
	const ctaLink = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' ) );
	const userInputState = useSelect( ( select ) => select( CORE_USER ).getUserInputState() );

	if ( userInputState === 'completed' ) {
		return null;
	}

	return (
		<Notification
			id={ `user-input-settings-notification-${ instanceID }` }
			title={ __( 'Customize Site Kit to match your goals', 'google-site-kit' ) }
			description={ __( 'Answer 5 questions and Site Kit will customize your dashboard with specific metrics and opportunities that match your site’s goals', 'google-site-kit' ) }
			format="large"
			isDismissable
			dismissExpires={ getTimeInSeconds( 'hour' ) * 3 }
			ctaLink={ ctaLink }
			ctaLabel={ __( 'Let’s go', 'google-site-kit' ) }
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			winImage={ global._googlesitekitLegacyData.admin.assetsRoot + personSitImage }
			className="googlesitekit-user-input__notification"
		/>
	);
}
