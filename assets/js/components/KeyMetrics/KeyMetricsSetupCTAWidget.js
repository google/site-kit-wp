/**
 * KeyMetricsSetupCTAWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import KeyMetricsCTAFooter from './KeyMetricsCTAFooter';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from './constants';
import whenActive from '../../util/when-active';
import { useShowTooltip } from '../AdminMenuTooltip';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import useDisplayCTAWidget from './hooks/useDisplayCTAWidget';
import KeyMetricsSetupCTARenderedEffect from './KeyMetricsSetupCTARenderedEffect';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import SetupCTA from '../../../js/googlesitekit/notifications/components/layout/SetupCTA';
import BannerSVGDesktop from '@/svg/graphics/banner-conversions-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-conversions-setup-cta-mobile.svg?url';

function KeyMetricsSetupCTAWidget( { Widget, WidgetNull } ) {
	const viewContext = useViewContext();
	const displayCTAWidget = useDisplayCTAWidget();
	const ctaLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);
	const fullScreenSelectionLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-metric-selection' )
	);

	const tooltipSettings = {
		tooltipSlug: KEY_METRICS_SETUP_CTA_WIDGET_SLUG,
		title: __(
			'You can always set up goals in Settings later',
			'google-site-kit'
		),
		content: __(
			'The Key Metrics section will be added back to your dashboard once you set your goals in Settings',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const openMetricsSelectionPanel = useCallback( async () => {
		await trackEvent(
			`${ viewContext }_kmw-cta-notification`,
			'confirm_pick_own_metrics'
		);

		navigateTo( fullScreenSelectionLink );
	}, [ navigateTo, fullScreenSelectionLink, viewContext ] );

	if ( ! displayCTAWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<KeyMetricsSetupCTARenderedEffect />
			<SetupCTA
				notificationID={ KEY_METRICS_SETUP_CTA_WIDGET_SLUG }
				footer={
					<KeyMetricsCTAFooter
						onActionClick={ openMetricsSelectionPanel }
					/>
				}
				title={ __(
					'Get personalized suggestions for user interaction metrics based on your goals',
					'google-site-kit'
				) }
				description={ __(
					'Answer 3 questions and we’ll suggest relevant metrics for your dashboard. These metrics will help you track how users interact with your site.',
					'google-site-kit'
				) }
				dismissButton={ {
					showTooltip,
				} }
				ctaButton={ {
					label: __( 'Get tailored metrics', 'google-site-kit' ),
					href: ctaLink,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'top',
				} }
				noPadding
			/>
		</Widget>
	);
}

KeyMetricsSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	KeyMetricsSetupCTAWidget
);
