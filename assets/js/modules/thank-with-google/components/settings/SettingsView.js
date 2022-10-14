/**
 * Thank with Google Settings View component.
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
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	MODULES_THANK_WITH_GOOGLE,
	TYPE_FIXED,
	TYPE_OVERLAY,
} from '../../datastore/constants';
import DisplaySetting from '../../../../components/DisplaySetting';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import Link from '../../../../components/Link';
import ProgressBar from '../../../../components/ProgressBar';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import {
	getColorThemes,
	getPlacementTypeLabel,
	getPlacementLabel,
	getCTAPostTypesString,
	getPlacementType,
} from '../../util/settings';
const { useSelect } = Data;

export default function SettingsView() {
	const publicationID = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getPublicationID()
	);
	const supporterWallSidebars = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getSupporterWallSidebars()
	);
	const colorTheme = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getColorTheme()
	);

	const ctaPlacement = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCTAPlacement()
	);

	const supporterWallURL = useSelect( ( select ) =>
		select( CORE_SITE ).getWidgetsAdminURL()
	);

	const postTypes = useSelect( ( select ) =>
		select( CORE_SITE ).getPostTypes()
	);

	const ctaPostTypes = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCTAPostTypes()
	);

	const editViewSettingsURL = useSelect(
		( select ) =>
			publicationID &&
			select( MODULES_THANK_WITH_GOOGLE ).getServicePublicationURL(
				publicationID
			)
	);

	let supporterWall;

	if ( supporterWallSidebars === undefined ) {
		supporterWall = <ProgressBar small />;
	} else if ( supporterWallSidebars.length > 0 ) {
		supporterWall = (
			<p className="googlesitekit-settings-module__meta-item-data">
				<DisplaySetting value={ supporterWallSidebars.join( ', ' ) } />
			</p>
		);
	} else {
		supporterWall = (
			<Fragment>
				<p className="googlesitekit-settings-module__meta-item-info">
					{ __(
						'A supporter wall widget shows the list of people who supported your site using Thank with Google.',
						'google-site-kit'
					) }
				</p>
				<p className="googlesitekit-settings-module__meta-item-data">
					<Link
						href={ supporterWallURL }
						className="googlesitekit-settings-module__cta-button"
					>
						{ __( 'Add supporter wall', 'google-site-kit' ) }
					</Link>
				</p>
			</Fragment>
		);
	}

	const { name: colorName } =
		getColorThemes().find(
			( { colorThemeID } ) => colorThemeID === colorTheme
		) || {};

	const placementType = getPlacementType( ctaPlacement );

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--thank-with-google">
			<StoreErrorNotices
				moduleSlug="thank-with-google"
				storeName={ MODULES_THANK_WITH_GOOGLE }
			/>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Publication ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ publicationID } />
					</p>
				</div>
				{ editViewSettingsURL && (
					<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
						<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
							<Link href={ editViewSettingsURL } external>
								{ createInterpolateElement(
									__(
										'Edit <VisuallyHidden>publication </VisuallyHidden>in Publisher Center',
										'google-site-kit'
									),
									{
										VisuallyHidden: <VisuallyHidden />,
									}
								) }
							</Link>
						</p>
					</div>
				) }
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Type', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting
							value={ getPlacementTypeLabel( ctaPlacement ) }
						/>
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ TYPE_FIXED === placementType &&
							__( 'Position', 'google-site-kit' ) }
						{ TYPE_OVERLAY === placementType &&
							__( 'Prominence', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting
							value={ getPlacementLabel( ctaPlacement ) }
						/>
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Color', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ colorName } />
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Post Types', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting
							value={ getCTAPostTypesString(
								ctaPostTypes,
								postTypes
							) }
						/>
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Supporter Wall Widget', 'google-site-kit' ) }
					</h5>
					{ supporterWall }
				</div>
			</div>
		</div>
	);
}
