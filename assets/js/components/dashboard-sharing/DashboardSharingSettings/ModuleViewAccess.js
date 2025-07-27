/**
 * ModuleViewAccess component for DashboardSharingSettings.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createInterpolateElement, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PropTypes from 'prop-types';
import UserRoleSelect from '../UserRoleSelect';
import Notice from '../../Notice';
import Link from '../../Link';
import Typography from '../../Typography';

const ModuleViewAccess = forwardRef(
	(
		{
			moduleSlug,
			isLocked,
			hasSharingCapability,
			recoverable,
			recoverableModuleSupportLink,
		},
		ref
	) => {
		if ( hasSharingCapability ) {
			return (
				<UserRoleSelect
					moduleSlug={ moduleSlug }
					isLocked={ isLocked }
					ref={ ref }
				/>
			);
		}

		if ( recoverable ) {
			return (
				<Notice
					className="googlesitekit-notice--small"
					type={ Notice.TYPES.WARNING }
					description={ createInterpolateElement(
						__(
							'Managing user required to manage view access. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ recoverableModuleSupportLink }
									external
									hideExternalIndicator
								/>
							),
						}
					) }
					hideIcon
				/>
			);
		}

		return (
			<Typography
				as="p"
				type="body"
				size="medium"
				className="googlesitekit-dashboard-sharing-settings__note"
			>
				{ __(
					'Contact managing user to manage view access',
					'google-site-kit'
				) }
			</Typography>
		);
	}
);

ModuleViewAccess.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	isLocked: PropTypes.bool.isRequired,
	hasSharingCapability: PropTypes.bool,
	recoverable: PropTypes.bool,
	recoverableModuleSupportLink: PropTypes.string,
};

ModuleViewAccess.displayName = 'ModuleViewAccess';

export default ModuleViewAccess;
