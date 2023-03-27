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
import { ADSENSE_GA4_TOP_EARNING_PAGES_NOTICE_DISMISSED_ITEM_KEY as DISMISSED_KEY } from '../../modules/adsense/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Button } from 'googlesitekit-components';

const { useSelect, useDispatch } = Data;

export default function SettingsNotice( props ) {
	const { children, type, dismiss, Icon = getIconFromType( type ) } = props;

	const { dismissItem } = useDispatch( CORE_USER );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( DISMISSED_KEY )
	);

	const Layout = children ? SettingsNoticeMultiRow : SettingsNoticeSingleRow;

	if ( isDismissed ) {
		return null;
	}

	return (
		<div
			className={ classnames(
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
							dismissItem( DISMISSED_KEY );
						} }
					>
						OK, Got it!
					</Button>
				</div>
			) }
		</div>
	);
}

// Extra props are used in child components.
SettingsNotice.propTypes = {
	children: PropTypes.node,
	notice: PropTypes.node.isRequired,
	type: PropTypes.oneOf( [ TYPE_INFO, TYPE_WARNING, TYPE_SUGGESTION ] ),
	Icon: PropTypes.elementType,
	LearnMore: PropTypes.elementType,
	dismiss: PropTypes.string,
};

SettingsNotice.defaultProps = {
	type: TYPE_INFO,
};
