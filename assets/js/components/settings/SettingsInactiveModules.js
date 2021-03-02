/**
 * SettingsInactiveModules component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import Data from 'googlesitekit-data';
import Layout from '../layout/Layout';
import Notification from '../legacy-notifications/notification';
import SetupModule from './SetupModule';
import { Cell, Grid, Row } from '../../material-components';
import thumbsUpImage from '../../../svg/thumbs-up.svg';
const { useSelect } = Data;

const SettingsInactiveModules = () => {
	const modulesData = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	if ( ! modulesData ) {
		return null;
	}

	const modules = Object.values( modulesData )
		.filter( ( module ) => ! module.internal && ! module.active )
		.sort( ( module1, module2 ) => module1.sort - module2.sort );

	if ( ! modules.length ) {
		return (
			<Cell size={ 12 }>
				<Notification
					id="no-more-modules"
					title={ __( 'Congrats, you’ve connected all services!', 'google-site-kit' ) }
					description={ __( 'We’re working on adding new services to Site Kit by Google all the time, so please check back in the future.', 'google-site-kit' ) }
					format="small"
					SmallImageSVG={ thumbsUpImage }
					type="win-success"
				/>
			</Cell>
		);
	}

	return (
		<Cell size={ 12 }>
			<Layout
				header
				title={ __( 'Connect More Services to Gain More Insights', 'google-site-kit' ) }
				relative
			>
				<Grid>
					<Row>
						{ modules.map( ( module ) => (
							<Cell
								key={ module.slug + '-module-wrapper' }
								size={ 4 }
							>
								<SetupModule
									key={ module.slug + '-module' }
									slug={ module.slug }
									name={ module.name }
									description={ module.description }
								/>
							</Cell>
						) ) }
					</Row>
				</Grid>
			</Layout>
		</Cell>
	);
};

export default SettingsInactiveModules;
