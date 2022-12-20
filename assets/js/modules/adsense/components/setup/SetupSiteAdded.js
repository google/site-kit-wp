/**
 * AdSense Setup Site Added component.
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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { MODULES_ADSENSE } from '../../datastore/constants';
import SiteSteps from '../common/SiteSteps';
import { ErrorNotices } from '../common';
const { useSelect, useDispatch } = Data;

export default function SetupSiteAdded( { finishSetup } ) {
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isDoingSubmitChanges()
	);

	const { completeSiteSetup } = useDispatch( MODULES_ADSENSE );
	const continueHandler = useCallback( async () => {
		if ( isDoingSubmitChanges ) {
			return;
		}

		const success = await completeSiteSetup();
		if ( success ) {
			finishSetup();
		}
	}, [ isDoingSubmitChanges, finishSetup, completeSiteSetup ] );

	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __( 'Let’s get your site ready for ads', 'google-site-kit' ) }
			</h3>

			<ErrorNotices />

			<p>
				{ __(
					'In order for your site to display ads, make sure you’ve completed these steps in AdSense',
					'google-site-kit'
				) }
			</p>

			<SiteSteps />

			<div className="googlesitekit-setup-module__action">
				<Button
					onClick={ continueHandler }
					disabled={ isDoingSubmitChanges }
				>
					{ __( 'Continue', 'google-site-kit' ) }
				</Button>
			</div>
		</Fragment>
	);
}

SetupSiteAdded.propTypes = {
	finishSetup: PropTypes.func,
};

SetupSiteAdded.defaultProps = {
	finishSetup: () => {},
};
