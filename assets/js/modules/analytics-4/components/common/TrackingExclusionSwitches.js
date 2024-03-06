/**
 * Analytics 4 Tracking Exclusion switches component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
const { useSelect, useDispatch } = Data;

export const TRACKING_LOGGED_IN_USERS = 'loggedinUsers';
export const TRACKING_CONTENT_CREATORS = 'contentCreators';

export const trackingExclusionLabels = {
	[ TRACKING_LOGGED_IN_USERS ]: __(
		'All logged-in users',
		'google-site-kit'
	),
	[ TRACKING_CONTENT_CREATORS ]: __(
		'Users that can write posts',
		'google-site-kit'
	),
};

export default function TrackingExclusionSwitches() {
	const trackingDisabled = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getTrackingDisabled()
	);
	const { setTrackingDisabled } = useDispatch( MODULES_ANALYTICS_4 );

	let message;
	if (
		trackingDisabled &&
		trackingDisabled.includes( TRACKING_LOGGED_IN_USERS )
	) {
		message = __(
			'All logged-in users will be excluded from Analytics tracking',
			'google-site-kit'
		);
	} else if (
		trackingDisabled &&
		trackingDisabled.includes( TRACKING_CONTENT_CREATORS )
	) {
		message = __(
			'Users that can write posts will be excluded from Analytics tracking',
			'google-site-kit'
		);
	} else {
		message = __(
			'All logged-in users will be included in Analytics tracking',
			'google-site-kit'
		);
	}

	const updateTrackingDisabled = useCallback(
		( users, exclude ) => {
			const trackingDisabledArray = exclude
				? trackingDisabled.concat( users )
				: trackingDisabled.filter( ( item ) => item !== users );

			setTrackingDisabled( trackingDisabledArray );
		},
		[ trackingDisabled, setTrackingDisabled ]
	);

	const onChangeTrackContentCreators = useCallback(
		( event ) => {
			const { checked: exclude } = event.target;
			updateTrackingDisabled( TRACKING_CONTENT_CREATORS, exclude );
		},
		[ updateTrackingDisabled ]
	);

	const onChangeTrackLoggedInUsers = useCallback(
		( event ) => {
			const { checked: exclude } = event.target;
			updateTrackingDisabled( TRACKING_LOGGED_IN_USERS, exclude );
		},
		[ updateTrackingDisabled ]
	);

	if ( ! Array.isArray( trackingDisabled ) ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<h4 className="googlesitekit-settings-module__fields-group-title">
				{ __( 'Exclude Analytics', 'google-site-kit' ) }
			</h4>

			<div className="googlesitekit-settings-module__meta-item">
				<div className="googlesitekit-settings-module__inline-items">
					<div className="googlesitekit-settings-module__inline-item">
						<Switch
							label={
								trackingExclusionLabels[
									TRACKING_LOGGED_IN_USERS
								]
							}
							checked={ trackingDisabled.includes(
								TRACKING_LOGGED_IN_USERS
							) }
							onClick={ onChangeTrackLoggedInUsers }
							hideLabel={ false }
						/>
					</div>
					{ ! trackingDisabled.includes(
						TRACKING_LOGGED_IN_USERS
					) && (
						<div className="googlesitekit-settings-module__inline-item">
							<Switch
								label={
									trackingExclusionLabels[
										TRACKING_CONTENT_CREATORS
									]
								}
								checked={ trackingDisabled.includes(
									TRACKING_CONTENT_CREATORS
								) }
								onClick={ onChangeTrackContentCreators }
								hideLabel={ false }
							/>
						</div>
					) }
				</div>
				<p>{ message }</p>
			</div>
		</div>
	);
}
