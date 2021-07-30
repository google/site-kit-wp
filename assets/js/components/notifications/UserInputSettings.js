/**
 * UserInputSettings component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useInstanceId as useInstanceID } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Notification from '../legacy-notifications/notification';
import { getTimeInSeconds } from '../../util';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import UserInputPromptSVG from '../../../svg/user-input-prompt.svg';
const { useSelect } = Data;

export default function UserInputSettings( { onCTAClick, onDismiss, isDismissable } ) {
	const instanceID = useInstanceID( UserInputSettings );
	const ctaLink = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' ) );
	const userInputState = useSelect( ( select ) => select( CORE_USER ).getUserInputState() );

	if ( userInputState === 'completed' ) {
		return null;
	}

	return (
		<Notification
			id={ `user-input-settings-notification-${ instanceID }` }
			className="googlesitekit-user-input__notification"
			title={ __( 'Customize Site Kit to match your goals', 'google-site-kit' ) }
			description={ __( 'Answer 5 questions and Site Kit will customize your dashboard with specific metrics and opportunities that match your site’s goals', 'google-site-kit' ) }
			format="large"
			dismissExpires={ getTimeInSeconds( 'hour' ) * 3 }
			ctaLink={ ctaLink }
			ctaLabel={ __( 'Let’s go', 'google-site-kit' ) }
			onCTAClick={ onCTAClick }
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			WinImageSVG={ UserInputPromptSVG }
			isDismissable={ isDismissable }
			onDismiss={ onDismiss }
		/>
	);
}

UserInputSettings.propTypes = {
	// Used to bypass link functionality within Storybook to avoid breakage.
	onCTAClick: PropTypes.func,
	onDismiss: PropTypes.func,
	isDismissable: PropTypes.bool,
};
