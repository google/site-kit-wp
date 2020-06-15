/**
 * DeviceSizeTabBar component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

const DeviceSizeTabBar = ( { activeIndex, deviceSizes, handleDeviceSizeUpdate } ) => {
	if ( ! deviceSizes.length ) {
		return null;
	}

	return (
		<TabBar
			className="googlesitekit-device-size-tab-bar"
			activeIndex={ activeIndex }
			handleActiveIndexUpdate={ handleDeviceSizeUpdate }
		>
			{ deviceSizes.map( ( deviceSize, i ) => {
				return (
					<Tab
						key={ `google-sitekit-device-size-tab-key-${ i }` }
						aria-label={ deviceSize.slug }
					>
						{ deviceSize.icon }
					</Tab>
				);
			}
			) }
		</TabBar>
	);
};

DeviceSizeTabBar.propTypes = {
	activeIndex: PropTypes.number,
	deviceSizes: PropTypes.array,
	handleDeviceSizeUpdate: PropTypes.func,
};

DeviceSizeTabBar.defaultProps = {
	activeIndex: 0,
	deviceSizes: [
		{
			index: 0,
			slug: 'mobile',
			icon: <svg name="google-sitekit-device-size-mobile" width="15" height="22" viewBox="0 0 15 22" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fillRule="evenodd" clipRule="evenodd" d="M2.23694 0L12.2369 0.01C13.3369 0.01 14.2369 0.9 14.2369 2V20C14.2369 21.1 13.3369 22 12.2369 22H2.23694C1.13694 22 0.236938 21.1 0.236938 20V2C0.236938 0.9 1.13694 0 2.23694 0ZM2.23694 20H12.2369V19H2.23694V20ZM12.2369 17H2.23694V5H12.2369V17ZM2.23694 2V3H12.2369V2H2.23694Z" />
			</svg>,
		},
		{
			index: 1,
			slug: 'desktop',
			icon: <svg name="google-sitekit-device-size-desktop" width="23" height="17" viewBox="0 0 23 17" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fillRule="evenodd" clipRule="evenodd" d="M19.2369 14C20.3369 14 21.2269 13.1 21.2269 12L21.2369 2C21.2369 0.9 20.3369 0 19.2369 0H3.23694C2.13694 0 1.23694 0.9 1.23694 2V12C1.23694 13.1 2.13694 14 3.23694 14H19.2369ZM3.23694 2H19.2369V12H3.23694V2ZM0.236938 15H22.2369V17H0.236938V15Z" />
			</svg>,
		},
	],
	handleDeviceSizeUpdate: () => {},
};

export default DeviceSizeTabBar;
