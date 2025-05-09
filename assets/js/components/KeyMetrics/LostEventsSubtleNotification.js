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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Link from '../Link';
import Notice from '../Notice';

export default function LostEventsSubtleNotification( {
	onSelectMetricsCallback,
	onDismissCallback,
} ) {
	const lostEventsDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'unavailable-metrics-data'
		)
	);
	return (
		<Notice
			type="warning"
			title={ __( 'Unavailable metrics data', 'google-site-kit' ) }
			description={ createInterpolateElement(
				__(
					'We couldn’t detect any events for some of your metrics in over 90 days. You can select other metrics for your dashboard. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ lostEventsDocumentationURL }
							external
							aria-label={ __(
								'Learn more about unavailable metric data',
								'google-site-kit'
							) }
						/>
					),
				}
			) }
			dismissButton={ {
				label: __( 'Got it', 'google-site-kit' ),
				onClick: onDismissCallback,
			} }
			ctaButton={ {
				label: __( 'Select metrics', 'google-site-kit' ),
				onClick: onSelectMetricsCallback,
			} }
		/>
	);
}

LostEventsSubtleNotification.propTypes = {
	...Notice.propTypes,
};
