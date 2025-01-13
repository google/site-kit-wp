/**
 * InfoNoticeWidget component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useDispatch, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { trackEvent, WEEK_IN_SECONDS } from '../../../../../../util';
import whenActive from '../../../../../../util/when-active';
import InfoNotice from '../InfoNotice';
import {
	AUDIENCE_INFO_NOTICES,
	AUDIENCE_INFO_NOTICE_HIDE_UI,
	AUDIENCE_INFO_NOTICE_SLUG,
} from './constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import withIntersectionObserver from '../../../../../../util/withIntersectionObserver';
import useViewContext from '../../../../../../hooks/useViewContext';

const InfoNoticeWithIntersectionObserver =
	withIntersectionObserver( InfoNotice );

function InfoNoticeWidget( { Widget, WidgetNull } ) {
	const viewContext = useViewContext();

	const availableAudiences = useInViewSelect( ( select ) => {
		const audiences = select( MODULES_ANALYTICS_4 ).getAvailableAudiences();
		return audiences?.map( ( audience ) => audience.name );
	}, [] );
	const configuredAudiences = useInViewSelect(
		( select ) => select( CORE_USER ).getConfiguredAudiences(),
		[]
	);

	const hasMatchingAudience = configuredAudiences?.some( ( audience ) =>
		availableAudiences?.includes( audience )
	);

	const noticesCount = AUDIENCE_INFO_NOTICES.length;

	const isDismissed = useInViewSelect(
		( select ) =>
			select( CORE_USER ).isPromptDismissed( AUDIENCE_INFO_NOTICE_SLUG ),
		[]
	);

	const hideNotice = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_INFO_NOTICE_HIDE_UI )
	);

	const dismissCount = useInViewSelect(
		( select ) =>
			select( CORE_USER ).getPromptDismissCount(
				AUDIENCE_INFO_NOTICE_SLUG
			),
		[]
	);

	const { dismissPrompt } = useDispatch( CORE_USER );

	const onDismiss = useCallback( () => {
		if ( undefined === dismissCount ) {
			return;
		}

		trackEvent(
			`${ viewContext }_audiences-info-notice`,
			'dismiss_notice',
			AUDIENCE_INFO_NOTICES[ dismissCount ].slug
		).finally( () => {
			const twoWeeksInSeconds = WEEK_IN_SECONDS * 2;
			const expiry =
				dismissCount + 1 < noticesCount ? twoWeeksInSeconds : 0;

			dismissPrompt( AUDIENCE_INFO_NOTICE_SLUG, {
				expiresInSeconds: expiry,
			} );
		} );
	}, [ dismissCount, dismissPrompt, noticesCount, viewContext ] );

	// Return null if there are no matching audiences or if the notice has been dismissed.
	if (
		hasMatchingAudience !== true ||
		isDismissed ||
		dismissCount === undefined ||
		dismissCount >= noticesCount ||
		hideNotice === true
	) {
		return <WidgetNull />;
	}

	const { slug, content } = AUDIENCE_INFO_NOTICES[ dismissCount ];

	return (
		<Widget noPadding>
			<InfoNoticeWithIntersectionObserver
				content={ content }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				onDismiss={ onDismiss }
				onInView={ () => {
					trackEvent(
						`${ viewContext }_audiences-info-notice`,
						'view_notice',
						slug
					);
				} }
			/>
		</Widget>
	);
}

InfoNoticeWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )( InfoNoticeWidget );
