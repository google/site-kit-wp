/**
 * Settings notice component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SettingsNoticeSingleRow from './SettingsNoticeSingleRow';
import SettingsNoticeMultiRow from './SettingsNoticeMultiRow';
import {
	TYPE_WARNING,
	TYPE_INFO,
	TYPE_SUGGESTION,
	getIconFromType,
} from './utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Button } from 'googlesitekit-components';

const { useSelect, useDispatch } = Data;

export default function SettingsNotice( props ) {
	const {
		className,
		children,
		type,
		dismiss = '',
		Icon = getIconFromType( type ),
		OuterCTA,
	} = props;

	const { dismissItem } = useDispatch( CORE_USER );

	const isDismissed = useSelect( ( select ) =>
		dismiss ? select( CORE_USER ).isItemDismissed( dismiss ) : undefined
	);

	if ( dismiss && isDismissed ) {
		return null;
	}

	const Layout = children ? SettingsNoticeMultiRow : SettingsNoticeSingleRow;

	return (
		<div
			className={ classnames(
				className,
				'googlesitekit-settings-notice',
				`googlesitekit-settings-notice--${ type }`,
				{
					'googlesitekit-settings-notice--single-row': ! children,
					'googlesitekit-settings-notice--multi-row': children,
				}
			) }
		>
			<div className="googlesitekit-settings-notice__icon">
				<Icon width="20" height="20" />
			</div>

			<div className="googlesitekit-settings-notice__body">
				<Layout { ...props } />
			</div>
			{ dismiss && (
				<div className="googlesitekit-settings-notice__button">
					<Button
						onClick={ () => {
							dismissItem( dismiss );
						} }
					>
						{ __( 'OK, Got it!', 'google-site-kit' ) }
					</Button>
				</div>
			) }
			{ OuterCTA && (
				<div className="googlesitekit-settings-notice__button">
					<OuterCTA />
				</div>
			) }
		</div>
	);
}

// Extra props are used in child components.
SettingsNotice.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
	notice: PropTypes.node.isRequired,
	type: PropTypes.oneOf( [ TYPE_INFO, TYPE_WARNING, TYPE_SUGGESTION ] ),
	Icon: PropTypes.elementType,
	LearnMore: PropTypes.elementType,
	CTA: PropTypes.elementType,
	OuterCTA: PropTypes.elementType,
};

SettingsNotice.defaultProps = {
	type: TYPE_INFO,
};
