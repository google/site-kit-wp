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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import useActivateModuleCallback from '../../hooks/useActivateModuleCallback';
import Link from '../Link';
import GhostCardGreenSVG from '../KeyMetrics/GhostCardGreenSVG';
import GhostCardRedSVG from '../KeyMetrics/GhostCardRedSVG';
import Widget from '../../googlesitekit/widgets/components/Widget';
import { Grid, Row, Cell } from '../../material-components';

const { useSelect } = Data;

export default function ConnectAnalyticsCTATile() {
	const moduleSlug = 'analytics-4';
	const handleConnectModule = useActivateModuleCallback( moduleSlug );

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);
	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( moduleSlug )
	);

	if ( ! module ) {
		return null;
	}

	return (
		<Widget
			className="googlesitekit-widget__analytics--visitor-groups"
			nopadding
			widgetSlug="analyticsAudienceSegmentation"
		>
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<div className="googlesitekit-widget--connectModuleCTATile">
							<div className="googlesitekit-km-connect-module-cta-tile">
								{ Icon && (
									<div className="googlesitekit-km-connect-module-cta-tile__icon">
										<Icon width="32" height="32" />
									</div>
								) }

								<div className="googlesitekit-km-connect-module-cta-tile__content">
									<p className="googlesitekit-km-connect-module-cta-tile__text">
										{ __(
											'Analytics is disconnected, your audience metrics can’t be displayed',
											'google-site-kit'
										) }
									</p>
									<Link
										secondary
										onClick={ handleConnectModule }
									>
										{ __(
											'Connect Google Analytics',
											'google-site-kit'
										) }
									</Link>
								</div>
							</div>

							<div className="googlesitekit-km-connect-module-cta-tile__ghost-card">
								<GhostCardGreenSVG />
							</div>
							<div className="googlesitekit-km-connect-module-cta-tile__ghost-card">
								<GhostCardRedSVG />
							</div>
						</div>
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}
