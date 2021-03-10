/**
 * SettingsConnectMoreServices component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SettingsModule from './SettingsModule';
import Layout from '../layout/Layout';
import SettingsOverlay from './SettingsOverlay';
import { Cell, Grid, Row } from '../../material-components';

function SettingsConnectMoreServices( { modules } ) {
	const { action } = useParams();

	return (
		<Layout
			header
			title={ __( 'Connect More Services to Gain More Insights', 'google-site-kit' ) }
			relative
		>
			<Grid>
				<Row>
					{ modules.map( ( module ) => (
						<Cell
							size={ 4 }
							key={ module.slug }
						>
							<SettingsModule module={ module } />
						</Cell>
					) ) }
				</Row>
			</Grid>
			{ action === 'edit' && <SettingsOverlay /> }
		</Layout>
	);
}

SettingsConnectMoreServices.propTypes = {
	match: PropTypes.shape( {
		params: PropTypes.shape( {
			moduleSlug: PropTypes.string,
		} ),
	} ).isRequired,
	modules: PropTypes.arrayOf(
		PropTypes.shape( {
			active: PropTypes.bool,
			autoActivate: PropTypes.bool,
			dependantModulesText: PropTypes.string.isRequired,
			description: PropTypes.string,
			homepage: PropTypes.string,
			name: PropTypes.string,
			provides: PropTypes.arrayOf( PropTypes.string ),
			setupComplete: PropTypes.bool,
			slug: PropTypes.string,
		} ).isRequired,
	).isRequired,
};

export default SettingsConnectMoreServices;
