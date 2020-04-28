/**
 * Analytics Tracking Exclusion switches component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
import Switch from '../../../components/switch';
const { useSelect, useDispatch } = Data;

const TRACKING_LOGGED_IN_USERS = 'loggedinUsers';

export const trackingExclusionLabels = {
	[ TRACKING_LOGGED_IN_USERS ]: __( 'Logged-in users', 'google-site-kit' ),
};

export default function TrackingExclusionSwitches() {
	const trackingDisabled = useSelect( ( select ) => select( STORE_NAME ).getTrackingDisabled() );

	const { setTrackingDisabled } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( event ) => {
		const { checked } = event.target;
		const exclusions = checked ? [ TRACKING_LOGGED_IN_USERS ] : [];
		setTrackingDisabled( exclusions );
	}, [ trackingDisabled ] );

	if ( ! Array.isArray( trackingDisabled ) ) {
		return null;
	}

	return (
		<fieldset className="googlesitekit-analytics-trackingdisabled">
			<legend className="googlesitekit-setup-module__text">
				{ __( 'Exclude from Analytics', 'google-site-kit' ) }
			</legend>

			<div className="mdc-form-field">
				<Switch
					label={ trackingExclusionLabels[ TRACKING_LOGGED_IN_USERS ] }
					checked={ trackingDisabled.includes( TRACKING_LOGGED_IN_USERS ) }
					onClick={ onChange }
					hideLabel={ false }
				/>
			</div>

			<p>
				{ trackingDisabled.includes( TRACKING_LOGGED_IN_USERS ) && __( 'Logged-in users will be excluded from Analytics tracking.', 'google-site-kit' ) }
				{ ! trackingDisabled.includes( TRACKING_LOGGED_IN_USERS ) && __( 'Logged-in users will be included in Analytics tracking.', 'google-site-kit' ) }
			</p>
		</fieldset>
	);
}
