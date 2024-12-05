/**
 * LostEventsSubtleNotification component.
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
import { Button } from 'googlesitekit-components';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import Warning from '../../../svg/icons/warning.svg';

export default function LostEventsSubtleNotification( {
	onSelectMetricsCallback,
	onDismissCallback,
} ) {
	return (
		<SubtleNotification
			className="googlesitekit-acr-subtle-notification googlesitekit-acr-subtle-notification__lost-events"
			title={ __( 'Unavailable metrics data', 'google-site-kit' ) }
			description={ __(
				'We couldn’t detect any events for some of your metrics in over 90 days. You can select other metrics for your dashboard',
				'google-site-kit'
			) }
			dismissCTA={
				<Button tertiary onClick={ onDismissCallback }>
					{ __( 'Got it', 'google-site-kit' ) }
				</Button>
			}
			additionalCTA={
				<Button onClick={ onSelectMetricsCallback }>
					{ __( 'Select metrics', 'google-site-kit' ) }
				</Button>
			}
			icon={ <Warning width={ 24 } height={ 24 } /> }
		/>
	);
}

LostEventsSubtleNotification.propTypes = {
	onSelectMetricsCallback: PropTypes.func.isRequired,
	onDismissCallback: PropTypes.func.isRequired,
};
