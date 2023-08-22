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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import useActivateModuleCallback from '../../hooks/useActivateModuleCallback';
import Link from '../Link';
import { Cell, Grid, Row } from '../../material-components';
import GhostCardGreenSVG from './GhostCardGreenSVG';
import GhostCardRedSVG from './GhostCardRedSVG';
import {
	CORE_USER,
	keyMetricsGA4Widgets,
} from '../../googlesitekit/datastore/user/constants';

const { useSelect } = Data;

export default function ConnectModuleCTATile( { moduleSlug } ) {
	const handleConnectModule = useActivateModuleCallback( moduleSlug );

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);
	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( moduleSlug )
	);

	const ga4DependantKeyMetrics = useSelect( ( select ) => {
		const keyMetrics = select( CORE_USER ).getKeyMetrics();

		if ( ! keyMetrics ) {
			return [];
		}

		return keyMetrics.filter( ( keyMetric ) =>
			keyMetricsGA4Widgets.includes( keyMetric )
		).length;
	} );

	if ( ! module ) {
		return null;
	}

	return (
		<div className="googlesitekit-widget--connectModuleCTATile googlesitekit-setup__wrapper--key-metrics-setup-cta">
			<Grid>
				<Row>
					<Cell size={ 6 }>
						<div className="googlesitekit-km-connect-module-cta-tile">
							{ Icon && (
								<div className="googlesitekit-km-connect-module-cta-tile__icon">
									<Icon width="32" height="32" />
								</div>
							) }

							<div className="googlesitekit-km-connect-module-cta-tile__content">
								<p className="googlesitekit-km-connect-module-cta-tile__text">
									{ sprintf(
										/* translators: %s: module name */
										__(
											'%s is disconnected, some of your metrics can’t be displayed',
											'google-site-kit'
										),
										module.name
									) }
								</p>
								<Link href="#" onClick={ handleConnectModule }>
									{ sprintf(
										/* translators: %s: module name */
										__( 'Connect %s', 'google-site-kit' ),
										module.name
									) }
								</Link>
							</div>
						</div>
					</Cell>
					{ ga4DependantKeyMetrics === 3 && (
						<Cell size={ 6 }>
							<div className="googlesitekit-ghost-cards googlesitekit-ghost-cards--two-horizontal">
								<GhostCardGreenSVG />
								<GhostCardRedSVG />
							</div>
						</Cell>
					) }
				</Row>
			</Grid>
		</div>
	);
}

ConnectModuleCTATile.propTypes = {
	moduleSlug: propTypes.string.isRequired,
};
