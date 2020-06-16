/**
 * DeviceSizeTabBar component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DeviceSizeMobileIcon from './icons/DeviceSizeMobileIcon';
import DeviceSizeDesktopIcon from './icons/DeviceSizeDesktopIcon';

const DeviceSizeTabBar = ( { activeTab, deviceSizes, handleDeviceSizeUpdate } ) => {
	const onUpdate = useCallback( ( index ) => {
		const device = deviceSizes[ index ];
		handleDeviceSizeUpdate( device, index );
	}, [ deviceSizes ] );

	if ( ! deviceSizes.length ) {
		return null;
	}

	const activeIndex = deviceSizes.findIndex( ( { slug } ) => slug === activeTab );

	return (
		<TabBar
			className="googlesitekit-device-size-tab-bar"
			activeIndex={ activeIndex }
			handleActiveIndexUpdate={ onUpdate }
		>
			{ deviceSizes.map( ( { slug, icon }, i ) => {
				return (
					<Tab
						key={ `google-sitekit-device-size-tab-key-${ i }` }
						aria-label={ slug }
					>
						{ icon }
					</Tab>
				);
			}
			) }
		</TabBar>
	);
};

DeviceSizeTabBar.propTypes = {
	activeIndex: PropTypes.number,
	deviceSizes: PropTypes.arrayOf(
		PropTypes.shape( {
			index: PropTypes.number,
			slug: PropTypes.string,
			icon: PropTypes.node,
		} ),
	),
	handleDeviceSizeUpdate: PropTypes.func,
};

DeviceSizeTabBar.defaultProps = {
	deviceSizes: [
		{
			slug: 'mobile',
			icon: <DeviceSizeMobileIcon />,
		},
		{
			slug: 'desktop',
			icon: <DeviceSizeDesktopIcon />,
		},
	],
	handleDeviceSizeUpdate: () => {},
};

export default DeviceSizeTabBar;
