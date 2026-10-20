/**
 * SettingsInactiveModules component.
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';

export default function SettingsGroup( { title, children, className } ) {
	return (
		<div
			className={ classnames(
				'googlesitekit-module-settings-group',
				className
			) }
		>
			<Typography
				as="h4"
				className="googlesitekit-module-settings-group__title"
				size={ SIZE_MEDIUM }
				type={ TYPE_TITLE }
			>
				{ title }
			</Typography>
			{ children }
		</div>
	);
}

SettingsGroup.propTypes = {
	title: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};
