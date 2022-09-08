/**
 * SetupBanner component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { Fragment, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import {
	PropertySelect,
	UseSnippetSwitch,
} from '../../../../analytics-4/components/common';
import ErrorNotice from '../../../../../components/ErrorNotice';
import SpinnerButton from '../../../../../components/SpinnerButton';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../../datastore/constants';
import useExistingTagEffect from '../../../../analytics-4/hooks/useExistingTagEffect';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS,
} from '../../../../analytics/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY } from '../../../constants';
import { useTooltipState } from '../../../../../components/AdminMenuTooltip/useTooltipState';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip/useShowTooltip';
import { AdminMenuTooltip } from '../../../../../components/AdminMenuTooltip/AdminMenuTooltip';
import { getBannerDismissalExpiryTime } from '../../../utils/banner-dismissal-expiry';
const { useDispatch, useSelect } = Data;

export default function SetupBanner( { onSubmitSuccess } ) {
	const [ errorNotice, setErrorNotice ] = useState( null );

	const hasExistingProperty = useSelect( ( select ) => {
		const accountID = select( MODULES_ANALYTICS ).getAccountID();
		const properties =
			select( MODULES_ANALYTICS_4 ).getProperties( accountID ) || [];
		return properties.length > 0;
	} );
	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);

	useExistingTagEffect();

	const referenceDateString = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const { submitChanges, selectProperty } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleSubmitChanges = useCallback( async () => {
		const { error } = await submitChanges();

		if ( error ) {
			setErrorNotice( error );

			return;
		}

		// Ask the parent component to show the success banner.
		onSubmitSuccess();
	}, [ onSubmitSuccess, submitChanges ] );

	const { isTooltipVisible } = useTooltipState(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	const showTooltip = useShowTooltip(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<AdminMenuTooltip
					title={ __(
						'You can connect Google Analytics 4 later here',
						'google-site-kit'
					) }
					content={ __(
						'You can configure the Google Analytics 4 property inside the Site Kit Settings later.',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Remind me later', 'google-site-kit' ) }
					tooltipStateKey={
						ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
					}
				/>
			</Fragment>
		);
	}

	let title;
	let ctaLabel;
	let footer;
	let children;

	if ( hasExistingProperty ) {
		title = __(
			'Connect the Google Analytics 4 property that’s associated with your existing Universal Analytics property',
			'google-site-kit'
		);
		ctaLabel = __( 'Connect', 'google-site-kit' );
		footer = __(
			'You can always add/edit this in the Site Kit Settings.',
			'google-site-kit'
		);
		children = (
			<div className="googlesitekit-ga4-setup-banner__field-group">
				<PropertySelect
					label={ __(
						'Google Analytics 4 Property',
						'google-site-kit'
					) }
				/>
				{ existingTag && (
					<UseSnippetSwitch
						description={
							<Fragment>
								<p>
									{ sprintf(
										/* translators: %s: existing tag ID */
										__(
											'A tag %s for the selected property already exists on the site.',
											'google-site-kit'
										),
										existingTag
									) }
								</p>
								<p>
									{ __(
										'Make sure you remove it if you decide to place the same GA4 tag via Site Kit, otherwise they will be duplicated.',
										'google-site-kit'
									) }
								</p>
							</Fragment>
						}
					/>
				) }
			</div>
		);
	} else {
		selectProperty( PROPERTY_CREATE );

		title = __(
			'No existing Google Analytics 4 property found, Site Kit will help you create a new one and insert it on your site',
			'google-site-kit'
		);
		ctaLabel = __( 'Create property', 'google-site-kit' );

		if ( existingTag ) {
			footer = sprintf(
				/* translators: %s: The existing tag ID. */
				__(
					'A GA4 tag %s is found on this site but this property is not associated with your Google Analytics account. You can always add/edit this in the Site Kit Settings.',
					'google-site-kit'
				),
				existingTag
			);
		} else if ( hasEditScope === false ) {
			footer = __(
				'You will need to give Site Kit permission to create an Analytics property on your behalf. You can always add/edit this in the Site Kit Settings.',
				'google-site-kit'
			);
		} else {
			footer = __(
				'You can always add/edit this in the Site Kit Settings.',
				'google-site-kit'
			);
		}
	}

	return (
		<BannerNotification
			id="ga4-activation-banner"
			className="googlesitekit-ga4-setup-banner"
			title={ title }
			ctaComponent={
				<SpinnerButton onClick={ handleSubmitChanges }>
					{ ctaLabel }
				</SpinnerButton>
			}
			footer={ <p>{ footer }</p> }
			dismiss={ __( 'Cancel', 'google-site-kit' ) }
			dismissExpires={ getBannerDismissalExpiryTime(
				referenceDateString
			) }
			onDismiss={ showTooltip }
		>
			{ errorNotice && <ErrorNotice error={ errorNotice } /> }
			{ children }
		</BannerNotification>
	);
}
