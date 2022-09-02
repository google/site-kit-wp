/**
 * Supporter Wall component for Thank with Google.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { Fragment } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import Link from '../../../../components/Link';
import ProgressBar from '../../../../components/ProgressBar';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
const { useSelect } = Data;

export default function SupporterWall() {
	const supporterWallSidebars = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getSupporterWallSidebars()
	);
	const supporterWallURL = useSelect( ( select ) =>
		select( CORE_SITE ).getWidgetsAdminURL()
	);

	const hasSupporterWallSidebar =
		supporterWallSidebars && supporterWallSidebars?.length > 0;

	return (
		<div className="googlesitekit-twg-setting-field googlesitekit-twg-supporter-wall">
			<h4>{ __( 'Supporter wall widget', 'google-site-kit' ) }</h4>

			{ supporterWallSidebars === undefined ? (
				<ProgressBar small />
			) : (
				<Fragment>
					{ ! hasSupporterWallSidebar ? (
						<p>
							{ __(
								'A supporter wall page shows the list of everyone who has supported your site using Thank with Google. Look for the "Thank with Google Supporter Wall" widget and add it to your site.',
								'google-site-kit'
							) }
						</p>
					) : (
						<Fragment>
							<h5 className="googlesitekit-twg-supporter-wall__headline">
								{ __( 'Widget Position', 'google-site-kit' ) }
							</h5>
							<p className="googlesitekit-twg-supporter-wall__value">
								<DisplaySetting
									value={ supporterWallSidebars.join( ', ' ) }
								/>
							</p>
						</Fragment>
					) }
					<Link
						className="googlesitekit-twg-supporter-wall__link"
						href={ supporterWallURL }
						external={ hasSupporterWallSidebar }
						hideExternalIndicator
					>
						{ sprintf(
							/* translators: %s is replaced with the appropriate action term */
							__( '%s supporter wall widget', 'google-site-kit' ),
							hasSupporterWallSidebar
								? __( 'Edit', 'google-site-kit' )
								: __( 'Activate', 'google-site-kit' )
						) }
					</Link>
				</Fragment>
			) }
		</div>
	);
}
