/**
 * WebDataStreamField component.
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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { useFeature } from '@/js/hooks/useFeature';
import useFormValue from '@/js/hooks/useFormValue';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { FORM_ACCOUNT_CREATE } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import CreateAccountField from './CreateAccountField';
import { WebDataStreamHint } from '@/js/modules/analytics-4/components/common';

export default function WebDataStreamField() {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

	const value = useFormValue( FORM_ACCOUNT_CREATE, 'dataStreamName' );
	const { setValues } = useDispatch( CORE_FORMS );

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const setValue = useCallback(
		( dataStreamName ) => {
			setValues( FORM_ACCOUNT_CREATE, { dataStreamName } );
		},
		[ setValues ]
	);

	// Ensure the hint is not shown when editing Analytics settings.
	const showHint = setupFlowRefreshEnabled && ! isAnalyticsConnected;

	return (
		<Fragment>
			<CreateAccountField
				label={ __( 'Web data stream', 'google-site-kit' ) }
				value={ value }
				hasError={ ! value }
				setValue={ setValue }
				name="dataStream"
			/>
			{ showHint && <WebDataStreamHint /> }
		</Fragment>
	);
}
