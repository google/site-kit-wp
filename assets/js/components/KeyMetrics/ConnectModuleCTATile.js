/**
 * ConnectModuleCTATile component.
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
import propTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import useActivateModuleCallback from '../../hooks/useActivateModuleCallback';
import Link from '../Link';
import GhostCardGreenSVG from './GhostCardGreenSVG';
import GhostCardRedSVG from './GhostCardRedSVG';
import MetricTileHeader from './MetricTileHeader';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

export default function ConnectModuleCTATile( { moduleSlug } ) {
	const handleConnectModule = useActivateModuleCallback( moduleSlug );

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( moduleSlug )
	);

	const widgets = useSelect(
		( select ) =>
			select( CORE_WIDGETS ).getWidgets(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
			) || []
	);

	const moduleWidgets = widgets.filter( ( widget ) =>
		widget.modules.includes( moduleSlug )
	);
	const firstWidget = KEY_METRICS_WIDGETS[ moduleWidgets[ 0 ]?.slug ];

	// If there are more than one metric tiles combined into this metric notice, update
	// the widget to remove the title and change the description copy.
	const combinedMetrics = moduleWidgets.length > 1;

	if ( ! module ) {
		return null;
	}

	return (
		<div
			className={ `googlesitekit-widget--connectModuleCTATile googlesitekit-km-widget-tile ${
				combinedMetrics && ' googlesitekit-km-widget-tile--combined'
			}` }
		>
			{ /* Only render the metric title if this tile replaces a single metric tile. */ }
			{ ! combinedMetrics && (
				<MetricTileHeader
					title={ firstWidget?.title }
					infoTooltip={ firstWidget?.description }
					loading={ false }
				/>
			) }
			<div className="googlesitekit-km-widget-tile__body">
				<div className="googlesitekit-km-connect-module-cta-tile">
					{ Icon && (
						<div className="googlesitekit-km-connect-module-cta-tile__icon">
							<Icon width="32" height="32" />
						</div>
					) }

					<div className="googlesitekit-km-connect-module-cta-tile__content">
						<p className="googlesitekit-km-connect-module-cta-tile__text">
							{ combinedMetrics
								? sprintf(
										/* translators: %s: module name */
										__(
											'%s is disconnected, some of your metrics can’t be displayed',
											'google-site-kit'
										),
										module.name
								  )
								: sprintf(
										/* translators: %s: module name */
										__(
											'%s is disconnected, metric can’t be displayed',
											'google-site-kit'
										),
										module.name
								  ) }
						</p>
						<Link secondary onClick={ handleConnectModule }>
							{ sprintf(
								/* translators: %s: module name */
								__( 'Connect %s', 'google-site-kit' ),
								module.name
							) }
						</Link>
					</div>
				</div>
			</div>

			{ combinedMetrics && (
				<Fragment>
					<div className="googlesitekit-km-connect-module-cta-tile__ghost-card">
						<GhostCardGreenSVG />
					</div>
					<div className="googlesitekit-km-connect-module-cta-tile__ghost-card">
						<GhostCardGreenSVG />
					</div>
					<div className="googlesitekit-km-connect-module-cta-tile__ghost-card">
						<GhostCardRedSVG />
					</div>
				</Fragment>
			) }
		</div>
	);
}

ConnectModuleCTATile.propTypes = {
	moduleSlug: propTypes.string.isRequired,
};
