/**
 * AnalyticsNotice component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../../../../components/Link';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import {
	TRACKING_LOGGED_IN_USERS,
	TRACKING_CONTENT_CREATORS,
} from '../../../analytics/components/common/TrackingExclusionSwitches';
const { useSelect } = Data;

const AnalyticsNotice = () => {
	const trackingDisabled = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getTrackingDisabled()
	);

	if (
		trackingDisabled === undefined ||
		( ! trackingDisabled?.includes( TRACKING_LOGGED_IN_USERS ) &&
			! trackingDisabled?.includes( TRACKING_CONTENT_CREATORS ) )
	) {
		return null;
	}

	return (
		<p>
			{ createInterpolateElement(
				__(
					'Analytics is currently set to not track some logged-in users. If you’re setting up or testing experiments on <a>optimize.google.com</a>, make sure you’re not logged in to your WordPress site, otherwise the experiment will fail.',
					'google-site-kit'
				),
				{
					a: <Link href="https://optimize.google.com" external />,
				}
			) }
		</p>
	);
};

export default AnalyticsNotice;
