/**
 * DeviceSizeTabBar component.
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

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import DeviceSizeMobileIcon from '../../svg/icons/device-size-mobile-icon.svg';
import DeviceSizeDesktopIcon from '../../svg/icons/device-size-desktop-icon.svg';

const DeviceSizeTabBar = ( {
	activeTab,
	disabled = false,
	handleDeviceSizeUpdate,
	deviceSizes = [
		{
			slug: 'mobile',
			label: __( 'Mobile', 'google-site-kit' ),
			icon: <DeviceSizeMobileIcon width="15" height="22" />,
		},
		{
			slug: 'desktop',
			label: __( 'Desktop', 'google-site-kit' ),
			icon: <DeviceSizeDesktopIcon width="23" height="17" />,
		},
	],
} ) => {
	const onUpdate = useCallback(
		( index ) => {
			const device = deviceSizes[ index ];
			handleDeviceSizeUpdate( device, index );
		},
		[ deviceSizes, handleDeviceSizeUpdate ]
	);

	if ( ! deviceSizes?.length ) {
		return null;
	}

	const activeIndex = deviceSizes.findIndex(
		( { slug } ) => slug === activeTab
	);

	return (
		<TabBar
			className="googlesitekit-device-size-tab-bar"
			activeIndex={ activeIndex }
			handleActiveIndexUpdate={ onUpdate }
		>
			{ deviceSizes.map( ( { icon, label }, i ) => {
				return (
					<Tab
						key={ `google-sitekit-device-size-tab-key-${ i }` }
						aria-label={ label }
						disabled={ disabled }
						focusOnActivate={ false }
					>
						{ icon }
					</Tab>
				);
			} ) }
		</TabBar>
	);
};

DeviceSizeTabBar.propTypes = {
	activeTab: PropTypes.string,
	disabled: PropTypes.bool,
	deviceSizes: PropTypes.arrayOf(
		PropTypes.shape( {
			label: PropTypes.string,
			slug: PropTypes.string,
			icon: PropTypes.node,
		} )
	),
	handleDeviceSizeUpdate: PropTypes.func,
};

DeviceSizeTabBar.defaultProps = {
	handleDeviceSizeUpdate: () => {},
};

export default DeviceSizeTabBar;
