/**
 * Reader Revenue Manager connect publication component.
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
import { ComponentProps, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, Select } from 'googlesitekit-components';
import { getLocale, languageCodeFormat, languageCodes } from '@/js/util';

interface LanguageOption {
	code: typeof languageCodes[ number ];
	displayName: string;
}

type SelectProps = Omit< ComponentProps< typeof Select >, 'id' | 'onChange' >;

interface PublicationSetupLanguageSelectProps extends SelectProps {
	id: string;
	onChange: ( value: string ) => void;
}

export function getOptions() {
	const locale = getLocale();

	const languages = languageCodes.reduce(
		( accumulator, code ): LanguageOption[] => {
			const formatted = languageCodeFormat( code, { locale } );
			const formattedEnglish = languageCodeFormat( code, {
				locale: 'en',
			} );

			const displayName = formatted || formattedEnglish;

			if ( displayName !== code ) {
				accumulator.push( {
					code,
					displayName,
				} );
			}

			return accumulator;
		},
		[]
	);

	return languages.sort( ( a, b ) =>
		a.displayName.localeCompare( b.displayName, [ locale ] )
	);
}

const PublicationSetupLanguageSelect: FC<
	PublicationSetupLanguageSelectProps
> = ( { id, onChange, ...props } ) => {
	const options = getOptions();

	const onEnhancedChange = useCallback(
		( value, item ) => {
			onChange( item.dataset.value );
		},
		[ onChange ]
	);

	return (
		<Select
			helperText={ null }
			id={ id }
			label={ __( 'Primary language', 'google-site-kit' ) }
			onEnhancedChange={ onEnhancedChange }
			enhanced
			outlined
			{ ...props }
		>
			{ options.map( ( languageOption ) => (
				<Option
					key={ languageOption.code }
					value={ languageOption.code }
				>
					{ languageOption.displayName }
				</Option>
			) ) }
		</Select>
	);
};

export default PublicationSetupLanguageSelect;
