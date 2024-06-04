/**
 * ConnectAnalyticsCTATileWidget component.
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
import Data from 'googlesitekit-data';
import useActivateModuleCallback from '../../../../../hooks/useActivateModuleCallback';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import Link from '../../../../../components/Link';

const { useSelect } = Data;

export default function ConnectAnalyticsCTATileWidget( { Widget } ) {
	const handleConnectModule = useActivateModuleCallback( 'analytics-4' );

	const Icon = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleIcon( 'analytics-4' )
	);

	return (
		<Widget>
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
								'Google Analytics is disconnected, your audience metrics can’t be displayed',
								'google-site-kit'
							) }
						</p>
						<Link secondary onClick={ handleConnectModule }>
							{ __(
								'Connect Google Analytics',
								'google-site-kit'
							) }
						</Link>
					</div>
				</div>
			</div>
		</Widget>
	);
}
