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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import KeyMetricsCTAContent from './KeyMetricsCTAContent';
import KeyMetricsCTAFooter from './KeyMetricsCTAFooter';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from './constants';
import whenActive from '../../util/when-active';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../AdminMenuTooltip';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import useDisplayCTAWidget from './hooks/useDisplayCTAWidget';
import KeyMetricsSetupCTARenderedEffect from './KeyMetricsSetupCTARenderedEffect';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

function KeyMetricsSetupCTAWidget( { Widget, WidgetNull } ) {
	const viewContext = useViewContext();
	const displayCTAWidget = useDisplayCTAWidget();
	const ctaLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);
	const fullScreenSelectionLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-metric-selection' )
	);

	const showTooltip = useShowTooltip( KEY_METRICS_SETUP_CTA_WIDGET_SLUG );
	const { isTooltipVisible } = useTooltipState(
		KEY_METRICS_SETUP_CTA_WIDGET_SLUG
	);

	const { setValue } = useDispatch( CORE_UI );
	const { dismissItem } = useDispatch( CORE_USER );

	const dismissCallback = async () => {
		await trackEvent(
			`${ viewContext }_kmw-cta-notification`,
			'dismiss_notification'
		);
		showTooltip();
		await dismissItem( KEY_METRICS_SETUP_CTA_WIDGET_SLUG );
	};

	const onTooltipDismiss = useCallback( () => {
		trackEvent( `${ viewContext }_kmw`, 'tooltip_dismiss' );
	}, [ viewContext ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const openMetricsSelectionPanel = useCallback( () => {
		navigateTo( fullScreenSelectionLink );

		trackEvent(
			`${ viewContext }_kmw-cta-notification`,
			'confirm_pick_own_metrics'
		);
	}, [ navigateTo, fullScreenSelectionLink, viewContext, setValue ] );

	const onGetTailoredMetricsClick = useCallback( () => {
		trackEvent(
			`${ viewContext }_kmw-cta-notification`,
			'confirm_get_tailored_metrics'
		);
	}, [ viewContext ] );

	useMount( () => {
		// Since components are conditionally rendered, when tooltip
		// appears, old component will unmount and new componnet will mount,
		// with tooltip visible equal to true, so here we ensure event is sent only once when that occurs,
		if ( isTooltipVisible ) {
			trackEvent( `${ viewContext }_kmw`, 'tooltip_view' );
		}
	} );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<WidgetNull />
				<AdminMenuTooltip
					title={ __(
						'You can always set up goals from Settings later',
						'google-site-kit'
					) }
					content={ __(
						'The Key Metrics section will be added back to your dashboard once you set your goals in Settings',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					tooltipStateKey={ KEY_METRICS_SETUP_CTA_WIDGET_SLUG }
					onDismiss={ onTooltipDismiss }
				/>
			</Fragment>
		);
	}

	if ( ! displayCTAWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget
			noPadding
			Footer={ () => (
				<KeyMetricsCTAFooter
					onActionClick={ openMetricsSelectionPanel }
				/>
			) }
		>
			<KeyMetricsCTAContent
				title={ __(
					'Get personalized suggestions for user interaction metrics based on your goals',
					'google-site-kit'
				) }
				description={ __(
					'Answer 3 questions and we’ll suggest relevant metrics for your dashboard. These metrics will help you track how users interact with your site.',
					'google-site-kit'
				) }
				actions={
					<Fragment>
						<KeyMetricsSetupCTARenderedEffect />
						<Button
							className="googlesitekit-key-metrics-cta-button"
							href={ ctaLink }
							onClick={ onGetTailoredMetricsClick }
						>
							{ __( 'Get tailored metrics', 'google-site-kit' ) }
						</Button>
						<Button tertiary onClick={ dismissCallback }>
							{ __( 'Maybe later', 'google-site-kit' ) }
						</Button>
					</Fragment>
				}
				ga4Connected
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
