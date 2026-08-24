/**
 * SetupCTAOverlays component.
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
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Notifications from '@/js/components/notifications/Notifications';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';

/**
 * Renders the setup CTA overlays, except while an on-demand tour is running.
 *
 * @since n.e.x.t
 *
 * @return {JSX.Element|null} The overlays area, or `null` while a tour runs.
 */
const SetupCTAOverlays: FC = () => {
	// A running tour draws its own overlay, so anything queued here would land
	// on top of it. Tours started from the queue never set `getCurrentTour()`,
	// so this only sees the ones triggered on demand elsewhere.
	const isTourRunning = useSelect(
		( select: Select ) => !! select( CORE_USER ).getCurrentTour(),
		[]
	);

	if ( isTourRunning ) {
		return null;
	}

	return (
		<Notifications
			areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
			groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
		/>
	);
};

export default SetupCTAOverlays;
