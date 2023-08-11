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
import { Fragment, useCallback } from '@wordpress/element';

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

const { useDispatch, useSelect } = Data;

function KeyMetricsSetupCTAWidget( { Widget, WidgetNull } ) {
	const keyMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetrics()
	);
	const ctaLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);
	const searchConsoleIsGatheringData = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);
	const analyticsIsGatheringData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

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
		showTooltip();
		await dismissItem( KEY_METRICS_SETUP_CTA_WIDGET_SLUG );
	};

	const openMetricsSelectionPanel = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ setValue ] );

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
				/>
			</Fragment>
		);
	}

	if (
		( Array.isArray( keyMetrics ) && keyMetrics.length > 0 ) ||
		isDismissed !== false ||
		analyticsIsGatheringData !== false ||
		searchConsoleIsGatheringData !== false
	) {
		return <WidgetNull />;
	}

	return (
		<Widget
			noPadding
			Footer={ () => {
				return (
					<KeyMetricsCTAFooter onActionClick={ dismissCallback } />
				);
			} }
		>
			<KeyMetricsCTAContent
				title={ __(
					'Get metrics and suggestions tailored to your specific goals',
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
