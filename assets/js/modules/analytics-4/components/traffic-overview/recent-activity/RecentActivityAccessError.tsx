/**
 * Recent activity access error component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import AccessErrorIllustration from '@/svg/graphics/recent-activity-access-error.svg';
import RecentActivityMessage from './RecentActivityMessage';

const RecentActivityAccessError: FC = () => {
	// The tab shows this state only when the user can't view the Analytics
	// data. So "get help" leads to the page about the permissions Analytics
	// needs, as "Get help" of a report error does for a permissions error.
	const helpURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: `${ MODULE_SLUG_ANALYTICS_4 }_insufficient_permissions`,
			} ),
		[]
	);

	const helpText = createInterpolateElement(
		__( 'Try refreshing or <a>get help</a>', 'google-site-kit' ),
		{
			a: <Link href={ helpURL } external hideExternalIndicator />,
		}
	);

	return (
		<RecentActivityMessage
			className="googlesitekit-traffic-overview__recent-activity-access-error"
			illustration={ <AccessErrorIllustration aria-hidden="true" /> }
			title={ __( 'No recent activity data found', 'google-site-kit' ) }
			sentences={ [
				__( 'We can’t access your traffic data.', 'google-site-kit' ),
				helpText,
			] }
		/>
	);
};

export default RecentActivityAccessError;
