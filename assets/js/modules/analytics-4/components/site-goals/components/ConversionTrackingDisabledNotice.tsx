/**
 * Site Goals conversion tracking disabled notice.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { useShouldShowConversionTrackingDisabledNotice } from '@/js/modules/analytics-4/components/site-goals/hooks/useShouldShowConversionTrackingDisabledNotice';
import { useConversionTrackingSetting } from '@/js/modules/analytics-4/hooks/useConversionTrackingSetting';

interface ConversionTrackingDisabledNoticeProps {
	Widget: ElementType;
	WidgetNull: ElementType;
}

const ConversionTrackingDisabledNotice: FC<
	ConversionTrackingDisabledNoticeProps
> = ( { Widget, WidgetNull } ) => {
	const shouldShowNotice = useShouldShowConversionTrackingDisabledNotice();
	const { canManageOptions } = useConversionTrackingSetting();

	const [ isSaving, setIsSaving ] = useState( false );

	const {
		resetConversionTrackingSettings,
		saveConversionTrackingSettings,
		setConversionTrackingEnabled,
	} = useDispatch( CORE_SITE );

	const handleEnableTracking = useCallback( async () => {
		setIsSaving( true );
		setConversionTrackingEnabled( true );

		const { error } = ( await saveConversionTrackingSettings() ) ?? {};

		if ( error ) {
			resetConversionTrackingSettings();
		}

		setIsSaving( false );
	}, [
		resetConversionTrackingSettings,
		saveConversionTrackingSettings,
		setConversionTrackingEnabled,
	] );

	if ( shouldShowNotice !== true ) {
		return <WidgetNull />;
	}

	const description = canManageOptions
		? __(
				'Site Kit can no longer measure events from your supported plugins, so the breakdown in this section has stopped updating. Enable plugin conversion tracking to keep it up to date.',
				'google-site-kit'
		  )
		: __(
				'Site Kit can no longer measure events from your supported plugins, so the breakdown in this section has stopped updating. Ask a site admin to enable plugin conversion tracking to keep it up to date.',
				'google-site-kit'
		  );

	return (
		<Widget noPadding>
			<Notice
				className="googlesitekit-site-goals-conversion-tracking-disabled-notice"
				type={ NOTICE_TYPES.WARNING }
				title={ __(
					'Plugin conversion tracking is disabled',
					'google-site-kit'
				) }
				description={ description }
				ctaButton={
					canManageOptions
						? {
								label: __(
									'Enable tracking',
									'google-site-kit'
								),
								onClick: handleEnableTracking,
								inProgress: isSaving,
								disabled: isSaving,
						  }
						: undefined
				}
			/>
		</Widget>
	);
};

export default ConversionTrackingDisabledNotice;
