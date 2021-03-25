/**
 * Subscribe with Google Settings View component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import { STORE_NAME } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
const { useSelect } = Data;

export default function SettingsView() {
	const publicationName = useSelect( ( select ) => select( STORE_NAME ).getPublicationName() );
	const publicationID = useSelect( ( select ) => select( STORE_NAME ).getPublicationID() );
	const revenueModel = useSelect( ( select ) => select( STORE_NAME ).getRevenueModel() );
	const products = useSelect( ( select ) => select( STORE_NAME ).getProducts() );
	const defaultProductPerPostType = useSelect( ( select ) => select( STORE_NAME ).getDefaultProductPerPostType() );

	return (
		<Fragment>

			<StoreErrorNotices moduleSlug="subscribe-with-google" storeName={ STORE_NAME } />

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Publication name', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ publicationName } />
					</p>
				</div>

				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Publication ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ publicationID } />
					</p>
				</div>

				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Revenue model', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ revenueModel } />
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Product(s)', 'google-site-kit' ) }
					</h5>
					{ products?.split( '\n' ).map( ( product ) => product.trim() ).map( ( product ) => (
						<p className="googlesitekit-settings-module__meta-item-data" key={ product }>
							<DisplaySetting value={ product } />
						</p>
					) ) }
				</div>

				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Post Types default to', 'google-site-kit' ) } (?)
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ defaultProductPerPostType } />
					</p>
				</div>
			</div>
		</Fragment>
	);
}
