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
import { useEffect, useState } from '@wordpress/element';
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
import AwardSVG from '../../../svg/award.svg';
const { useSelect } = Data;

const SettingsInactiveModules = () => {
	// We store `initialInactiveSlugs` separately to avoid
	// layout shifts when activating a module as it would otherwise
	// cause the activated module to be removed upon activation.
	const [ initialInactiveSlugs, setInitialInactiveSlugs ] = useState();
	const modules = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	useEffect( () => {
		// Only set initialInactiveSlugs once, as soon as modules are available.
		if ( ! modules || initialInactiveSlugs !== undefined ) {
			return;
		}

		const inactiveSlugs = Object.keys( modules )
			.filter( ( slug ) => ! modules[ slug ].active );

		setInitialInactiveSlugs( inactiveSlugs );
	}, [ modules, initialInactiveSlugs ] );

	if ( ! initialInactiveSlugs ) {
		return null;
	}

	const inactiveModules = initialInactiveSlugs
		.map( ( slug ) => modules[ slug ] )
		.filter( ( module ) => ! module.internal )
		.sort( ( a, b ) => a.order - b.order )
	;

	if ( inactiveModules.length === 0 ) {
		return (
			<Notification
				id="no-more-modules"
				title={ __( 'Congrats, you’ve connected all services!', 'google-site-kit' ) }
				description={ __( 'We’re working on adding new services to Site Kit by Google all the time, so please check back in the future.', 'google-site-kit' ) }
				format="small"
				SmallImageSVG={ AwardSVG }
				type="win-success"
			/>
		);
	}

	return (
		<Layout
			header
			title={ __( 'Connect More Services to Gain More Insights', 'google-site-kit' ) }
			relative
		>
			<Grid>
				<Row>
					{ inactiveModules.map( ( module ) => (
						<Cell
							key={ module.slug }
							size={ 4 }
						>
							<SetupModule
								slug={ module.slug }
								name={ module.name }
								description={ module.description }
							/>
						</Cell>
					) ) }
				</Row>
			</Grid>
		</Layout>
	);
};

export default SettingsInactiveModules;
