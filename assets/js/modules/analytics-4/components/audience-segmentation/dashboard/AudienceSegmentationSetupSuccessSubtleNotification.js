/**
 * AudienceSegmentationSetupSuccessSubtleNotification component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import SubtleNotification from '../../SubtleNotification';
import { getNavigationalScrollTop } from '../../../../../util/scroll';
import { useBreakpoint } from '../../../../../hooks/useBreakpoint';

export default function AudienceSegmentationSetupSuccessSubtleNotification() {
	const breakpoint = useBreakpoint();

	const scrollToWidgetArea = ( event ) => {
		event.preventDefault();

		setTimeout( () => {
			const widgetClass =
				'.googlesitekit-widget-area--mainDashboardTrafficAudienceSegmentation';

			global.scrollTo( {
				top: getNavigationalScrollTop( widgetClass, breakpoint ),
				behavior: 'smooth',
			} );
		}, 50 );
	};

	return (
		<SubtleNotification
			title={ __(
				'Success! Visitor groups added to your dashboard',
				'google-site-kit'
			) }
			description={ __(
				'Get to know how different types of visitors interact with your site, e.g. which pages they visit and for how long.',
				'google-site-kit'
			) }
			additionalCTA={
				<Button onClick={ scrollToWidgetArea }>
					{ __( 'Show me', 'google-site-kit' ) }
				</Button>
			}
		/>
	);
}
