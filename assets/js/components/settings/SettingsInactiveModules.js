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
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useSelect } from 'googlesitekit-data';
import Layout from '@/js/components/layout/Layout';
import SetupModule from './SetupModule';
import { Cell, Grid, Row } from '@/js/material-components';
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';

export default function SettingsInactiveModules() {
	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	if ( ! modules ) {
		return null;
	}

	const inactiveModules = Object.keys( modules )
		.map( ( slug ) => modules[ slug ] )
		.filter( ( { internal, active } ) => ! internal && ! active )
		.sort( ( a, b ) => a.order - b.order );

	if ( inactiveModules.length === 0 ) {
		return (
			<Notice
				id="no-more-modules"
				title={ __(
					'Congrats, you’ve connected all services!',
					'google-site-kit'
				) }
				description={ __(
					'We’re working on adding new services to Site Kit by Google all the time, so please check back in the future',
					'google-site-kit'
				) }
				type={ TYPES.SUCCESS }
			/>
		);
	}

	return (
		<Layout
			title={ __(
				'Connect More Services to Gain More Insights',
				'google-site-kit'
			) }
			header
			rounded
			relative
		>
			<Grid>
				<Row>
					{ inactiveModules.map( ( { slug, name, description } ) => (
						<Cell key={ slug } size={ 4 }>
							<SetupModule
								slug={ slug }
								name={ name }
								description={ description }
							/>
						</Cell>
					) ) }
				</Row>
			</Grid>
		</Layout>
	);
}
