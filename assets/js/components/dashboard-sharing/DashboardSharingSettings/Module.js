/**
 * DashboardSharingSettings Module component.
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
 * External dependencies
 */
import { Tooltip } from '@material-ui/core';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import {
	createInterpolateElement,
	useCallback,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ModuleIcon from '../../ModuleIcon';
import { Select, Option } from '../../../material-components';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function Module( { moduleSlug, moduleName } ) {
	const [ manageViewAccess, setManageViewAccess ] = useState( 'only-me' );
	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);

	const handleOnChange = useCallback(
		( event ) => {
			setManageViewAccess( event.target.value );
		},
		[ setManageViewAccess ]
	);

	return (
		<div
			className="googlesitekit-dashboard-sharing-settings__module googlesitekit-dashboard-sharing-settings__row"
			key={ moduleSlug }
		>
			<div className="googlesitekit-dashboard-sharing-settings__column--product">
				<ModuleIcon slug={ moduleSlug } size={ 48 } />

				<span className="googlesitekit-dashboard-sharing-settings__module-name">
					{ moduleName }
				</span>
			</div>

			<div className="googlesitekit-dashboard-sharing-settings__column--view">
				<p className="googlesitekit-dashboard-sharing-settings__note">
					{ __(
						'Contact managing user to manage view access',
						'google-site-kit'
					) }
				</p>
			</div>

			{ ! hasMultipleAdmins && (
				<div className="googlesitekit-dashboard-sharing-settings__column--manage">
					<Select
						className="googlesitekit-dashboard-sharing-settings__select"
						value={ manageViewAccess }
						onChange={ handleOnChange }
						outlined
					>
						<Option value="only-me">
							{ __( 'Only me', 'google-site-kit' ) }
						</Option>
						<Option value="only-you">
							{ __( 'Only you', 'google-site-kit' ) }
						</Option>
					</Select>

					<p className="googlesitekit-dashboard-sharing-settings__note">
						{ createInterpolateElement(
							sprintf(
								/* translators: %s: user who manages the module. */
								__(
									'<span>Managed by </span> <strong>%s</strong>',
									'google-site-kit'
								),
								'Admin 1'
							),
							{
								span: <span />,
								strong: <strong />,
							}
						) }

						<Tooltip
							title={ sprintf(
								/* translators: %s: name of the user who manages the module. */
								__(
									'%s has connected this and given managing permissions to all admins. You can change who can view this on the dashboard.',
									'google-site-kit'
								),
								'Admin 1'
							) }
							classes={ {
								popper: 'googlesitekit-tooltip-popper',
								tooltip: 'googlesitekit-tooltip',
							} }
						>
							<span className="googlesitekit-dashboard-sharing-settings__tooltip-icon">
								<Icon icon={ info } size={ 18 } />
							</span>
						</Tooltip>
					</p>
				</div>
			) }
		</div>
	);
}

Module.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	moduleName: PropTypes.string.isRequired,
};
