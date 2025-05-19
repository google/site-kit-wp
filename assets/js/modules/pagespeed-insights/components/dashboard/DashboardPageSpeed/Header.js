/**
 * PageSpeed Widget Header component.
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
import { forwardRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import DeviceSizeTabBar from '../../../../../components/DeviceSizeTabBar';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import {
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
	DATA_SRC_FIELD,
	DATA_SRC_LAB,
	DATA_SRC_RECOMMENDATIONS,
	UI_STRATEGY,
	UI_DATA_SOURCE,
} from '../../../datastore/constants';

const Header = forwardRef( ( { isFetching, updateActiveTab }, ref ) => {
	const strategy =
		useSelect( ( select ) => select( CORE_UI ).getValue( UI_STRATEGY ) ) ||
		STRATEGY_MOBILE;

	const dataSrc =
		useSelect( ( select ) =>
			select( CORE_UI ).getValue( UI_DATA_SOURCE )
		) || DATA_SRC_LAB;

	const { setValues } = useDispatch( CORE_UI );

	// Update the active tab for "mobile" or "desktop".
	const updateActiveDeviceSize = useCallback(
		( { slug } ) => {
			if ( slug === STRATEGY_DESKTOP ) {
				setValues( { [ UI_STRATEGY ]: STRATEGY_DESKTOP } );
			} else {
				setValues( { [ UI_STRATEGY ]: STRATEGY_MOBILE } );
			}
		},
		[ setValues ]
	);

	return (
		<header className="googlesitekit-pagespeed-widget__header" ref={ ref }>
			<div className="googlesitekit-pagespeed-widget__data-src-tabs">
				<TabBar
					activeIndex={ [
						DATA_SRC_LAB,
						DATA_SRC_FIELD,
						DATA_SRC_RECOMMENDATIONS,
					].indexOf( dataSrc ) }
					handleActiveIndexUpdate={ updateActiveTab }
				>
					<Tab
						focusOnActivate={ false }
						aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_LAB }` }
						disabled={ isFetching }
					>
						<span
							id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_LAB }` }
							className="mdc-tab__text-label"
						>
							{ __( 'In the Lab', 'google-site-kit' ) }
						</span>
					</Tab>
					<Tab
						focusOnActivate={ false }
						aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_FIELD }` }
						disabled={ isFetching }
					>
						<span
							id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_FIELD }` }
							className="mdc-tab__text-label"
						>
							{ __( 'In the Field', 'google-site-kit' ) }
						</span>
					</Tab>
					<Tab
						focusOnActivate={ false }
						aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_RECOMMENDATIONS }` }
						disabled={ isFetching }
					>
						<span
							id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_RECOMMENDATIONS }` }
							className="mdc-tab__text-label"
						>
							{ __( 'How to improve', 'google-site-kit' ) }
						</span>
					</Tab>
				</TabBar>
			</div>
			<div className="googlesitekit-pagespeed-widget__device-size-tab-bar-wrapper">
				<DeviceSizeTabBar
					activeTab={ strategy }
					disabled={ isFetching }
					handleDeviceSizeUpdate={ updateActiveDeviceSize }
				/>
			</div>
		</header>
	);
} );

export default Header;
