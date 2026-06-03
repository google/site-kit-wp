/**
 * InternalServerError component.
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import BannerNotification, {
	TYPES,
} from '@/js/googlesitekit/notifications/components/layout/BannerNotification';
import Notification from '@/js/googlesitekit/notifications/components/Notification';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import { useFeature } from '@/js/hooks/useFeature';
import { getNavigationalScrollTop } from '@/js/util/scroll';

const NOTIFICATION_ID = 'internal-server-error';

export default function InternalServerError() {
	const breakpoint = useBreakpoint();
	const setupFlowRefreshPhase4Enabled = useFeature(
		'setupFlowRefreshPhase4'
	);
	const error = useSelect( ( select ) =>
		select( CORE_SITE ).getInternalServerError()
	);

	const isAnalyticsCTAActivationError =
		setupFlowRefreshPhase4Enabled &&
		error?.id === 'analytics-4-setup-error';

	// Scroll to the notification when the error is present.
	useEffect( () => {
		if ( ! error || isAnalyticsCTAActivationError ) {
			return;
		}

		global.scrollTo( {
			top: getNavigationalScrollTop(
				`#${ NOTIFICATION_ID }`,
				breakpoint
			),
			behavior: 'smooth',
		} );
	}, [ error, breakpoint, isAnalyticsCTAActivationError ] );

	if ( ! error || isAnalyticsCTAActivationError ) {
		return null;
	}

	return (
		<Notification id={ NOTIFICATION_ID }>
			<BannerNotification
				notificationID={ NOTIFICATION_ID }
				type={ TYPES.ERROR }
				title={ error.title }
				description={ error.description }
			/>
		</Notification>
	);
}
