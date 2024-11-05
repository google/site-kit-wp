/**
 * ACRDashboardSubtleNotification component.
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
import { useCallback, createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import StarFill from '../../../svg/icons/star-fill.svg';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from './constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { useShowTooltip } from '../AdminMenuTooltip';
import Link from '../Link';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

export default function ACRDashboardSubtleNotification() {
	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'advanced-conversion-reporting'
		)
	);

	const { dismissNewConversionReportingEvents } =
		useDispatch( MODULES_ANALYTICS_4 );

	// This component shares the tooltip defined in KeyMetricsSetupCTAWidget.
	const showTooltip = useShowTooltip( KEY_METRICS_SETUP_CTA_WIDGET_SLUG );

	const onDismiss = useCallback( () => {
		dismissNewConversionReportingEvents();
		showTooltip();
	}, [ dismissNewConversionReportingEvents, showTooltip ] );

	const isSaving = useSelect( ( select ) =>
		select( CORE_USER ).isFetchingSaveKeyMetricsSettings()
	);

	const { saveKeyMetricsSettings } = useDispatch( CORE_USER );

	const keyMetricSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);

	const handleCTAClick = useCallback( () => {
		saveKeyMetricsSettings( {
			...keyMetricSettings,
			includeConversionTailoredMetrics: true,
		} );
	}, [ keyMetricSettings, saveKeyMetricsSettings ] );

	return (
		<SubtleNotification
			className="googlesitekit-acr-subtle-notification"
			title={ __( 'New key metrics were added!', 'google-site-kit' ) }
			description={ createInterpolateElement(
				__(
					'We’ve extended your metrics selection with metrics that aren’t available by default in Analytics. Add them to your dashboard to get a better understanding of how users interact with your site. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ documentationURL }
							external
							aria-label={ __(
								'Learn more about advanced conversion reporting',
								'google-site-kit'
							) }
						/>
					),
				}
			) }
			dismissCTA={
				<Button tertiary onClick={ onDismiss }>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>
			}
			additionalCTA={
				<SpinnerButton onClick={ handleCTAClick } isSaving={ isSaving }>
					{ __( 'Add metrics', 'google-site-kit' ) }
				</SpinnerButton>
			}
			icon={ <StarFill width={ 24 } height={ 24 } /> }
		/>
	);
}
