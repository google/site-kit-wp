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
import classnames from 'classnames';
import { withRouter } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SettingsModule from './SettingsModule';
import Layout from '../layout/Layout';
import Notification from '../legacy-notifications/notification';
import SettingsOverlay from './SettingsOverlay';
import thumbsUpImage from '../../../images/thumbs-up.png';

function SettingsConnectMoreServices( { modules, match } ) {
	const modulesAvailable = 0 < modules.length;
	const isEditing = match.params.action === 'edit';

	// Show congratulatory notification if no modules to connect.
	if ( ! modulesAvailable ) {
		return (
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-12
			">
				<Notification
					id="no-more-modules"
					title={ __( 'Congrats, you’ve connected all services!', 'google-site-kit' ) }
					description={ __( 'We’re working on adding new services to Site Kit by Google all the time, so please check back in the future.', 'google-site-kit' ) }
					format="small"
					smallImage={ global._googlesitekitLegacyData.admin.assetsRoot + thumbsUpImage }
					type="win-success"
				/>
			</div>
		);
	}

	return (
		<div className={ classnames(
			'mdc-layout-grid__cell',
			'mdc-layout-grid__cell--span-12',
		) }>
			<Layout
				header
				title={ __( 'Connect More Services to Gain More Insights', 'google-site-kit' ) }
				relative
			>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						{ modules.map( ( module ) => (
							<div
								className="mdc-layout-grid__cell mdc-layout-grid__cell--span-4"
								key={ module.slug + '-module-wrapper' }
							>
								<SettingsModule module={ module } />
							</div>
						) ) }
					</div>
				</div>
				{ isEditing && <SettingsOverlay /> }
			</Layout>
		</div>
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

export default withRouter( SettingsConnectMoreServices );
