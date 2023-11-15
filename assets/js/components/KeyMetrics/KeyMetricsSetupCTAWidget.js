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
import { Fragment, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import Link from '../Link';
import KeyMetricsCTAContent from './KeyMetricsCTAContent';
import KeyMetricsCTAFooter from './KeyMetricsCTAFooter';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
	KEY_METRICS_SETUP_CTA_WIDGET_SLUG,
} from './constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import whenActive from '../../util/when-active';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../AdminMenuTooltip';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER } from '../../modules/analytics-4/constants';

const { useDispatch, useSelect } = Data;

function KeyMetricsSetupCTAWidget( { Widget, WidgetNull } ) {
	const viewContext = useViewContext();
	const ctaLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);

	// We should call isGatheringData() within this component for completeness as we do not want to rely
	// on it being called in other components. This selector makes report requests which, if they return
	// data, then the `data-available` transients are set. These transients are prefetched as a global on
	// the next page load.
	const searchConsoleIsDataAvailableOnLoad = useSelect( ( select ) => {
		select( MODULES_SEARCH_CONSOLE ).isGatheringData();
		return select( MODULES_SEARCH_CONSOLE ).isDataAvailableOnLoad();
	} );
	const analyticsIsDataAvailableOnLoad = useSelect( ( select ) => {
		select( MODULES_ANALYTICS_4 ).isGatheringData();
		return select( MODULES_ANALYTICS_4 ).isDataAvailableOnLoad();
	} );

	const showTooltip = useShowTooltip( KEY_METRICS_SETUP_CTA_WIDGET_SLUG );
	const { isTooltipVisible } = useTooltipState(
		KEY_METRICS_SETUP_CTA_WIDGET_SLUG
	);
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( KEY_METRICS_SETUP_CTA_WIDGET_SLUG )
	);

	const { dismissItem } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );

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

	const openMetricsSelectionPanel = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
		trackEvent(
			`${ viewContext }_kmw-cta-notification`,
			'confirm_pick_own_metrics'
		);
	}, [ setValue, viewContext ] );

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

	useEffect( () => {
		if (
			isDismissed === false &&
			analyticsIsDataAvailableOnLoad &&
			searchConsoleIsDataAvailableOnLoad
		) {
			setValue( HIDE_ENHANCED_MEASUREMENT_ACTIVATION_BANNER, true );
		}
	}, [
		isDismissed,
		analyticsIsDataAvailableOnLoad,
		searchConsoleIsDataAvailableOnLoad,
		setValue,
	] );

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
						'The Key Metrics section will be added back to your dashboard once you set your goals in Settings.',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					tooltipStateKey={ KEY_METRICS_SETUP_CTA_WIDGET_SLUG }
					onDismiss={ onTooltipDismiss }
				/>
			</Fragment>
		);
	}

	if (
		isDismissed !== false ||
		! analyticsIsDataAvailableOnLoad ||
		! searchConsoleIsDataAvailableOnLoad
	) {
		return <WidgetNull />;
	}

	return (
		<Widget
			noPadding
			Footer={ () => (
				<KeyMetricsCTAFooter onActionClick={ dismissCallback } />
			) }
		>
			<KeyMetricsCTAContent
				title={ __(
					'Get metrics and suggestions tailored to your specific site goals',
					'google-site-kit'
				) }
				description={ __(
					'Answer 3 questions to show relevant stats for your site',
					'google-site-kit'
				) }
				actions={
					<Fragment>
						<Button
							className="googlesitekit-key-metrics-cta-button"
							href={ ctaLink }
							onClick={ onGetTailoredMetricsClick }
						>
							{ __( 'Get tailored metrics', 'google-site-kit' ) }
						</Button>
						{ /*
							The `onClick` prop is used to ensure consistent styling for the link button across various widgets and banners.
							In the future, it will also serve the purpose of adding a track event.
						*/ }
						<Link onClick={ openMetricsSelectionPanel }>
							{ __(
								'I’ll pick metrics myself',
								'google-site-kit'
							) }
						</Link>
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
