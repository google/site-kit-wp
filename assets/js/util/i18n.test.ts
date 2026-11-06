/**
 * `getLocale` tests
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
 * Internal dependencies
 */
import { getLocale } from './i18n';

function createGlobal( locale: string ) {
	return {
		_googlesitekitLegacyData: { locale },
		navigator: { language: 'fr-CA' },
	} as unknown as typeof globalThis;
}

describe( 'getLocale', () => {
	// Every locale WordPress offers, from https://api.wordpress.org/translations/core/1.0/,
	// plus the default `en_US` and `haw_US`, which crashed the dashboard before.
	it.each( [
		'af',
		'am',
		'ar',
		'arg',
		'ary',
		'as',
		'az',
		'azb',
		'bel',
		'bg_BG',
		'bn_BD',
		'bo',
		'bs_BA',
		'ca',
		'ca_valencia',
		'ceb',
		'ckb',
		'cs_CZ',
		'cy',
		'da_DK',
		'de_AT',
		'de_CH',
		'de_CH_informal',
		'de_DE',
		'de_DE_formal',
		'dsb',
		'dzo',
		'el',
		'en_AU',
		'en_CA',
		'en_GB',
		'en_NZ',
		'en_US',
		'en_ZA',
		'eo',
		'es_AR',
		'es_CL',
		'es_CO',
		'es_CR',
		'es_DO',
		'es_EC',
		'es_ES',
		'es_GT',
		'es_MX',
		'es_PE',
		'es_PR',
		'es_UY',
		'es_VE',
		'et',
		'eu',
		'fa_AF',
		'fa_IR',
		'fi',
		'fo',
		'fr_BE',
		'fr_CA',
		'fr_FR',
		'fur',
		'fy',
		'gd',
		'gl_ES',
		'gu',
		'haw_US',
		'haz',
		'he_IL',
		'hi_IN',
		'hr',
		'hsb',
		'hu_HU',
		'hy',
		'id_ID',
		'is_IS',
		'it_IT',
		'ja',
		'jv_ID',
		'ka_GE',
		'kab',
		'kir',
		'kk',
		'km',
		'kn',
		'ko_KR',
		'lo',
		'lt_LT',
		'lv',
		'mk_MK',
		'ml_IN',
		'mn',
		'mr',
		'ms_MY',
		'my_MM',
		'nb_NO',
		'ne_NP',
		'nl_BE',
		'nl_NL',
		'nl_NL_formal',
		'nn_NO',
		'oci',
		'pa_IN',
		'pcm',
		'pl_PL',
		'ps',
		'pt_AO',
		'pt_BR',
		'pt_PT',
		'pt_PT_ao90',
		'rhg',
		'ro_RO',
		'ru_RU',
		'sah',
		'si_LK',
		'sk_SK',
		'skr',
		'sl_SI',
		'snd',
		'sq',
		'sr_RS',
		'sv_SE',
		'sw',
		'szl',
		'ta_IN',
		'ta_LK',
		'tah',
		'te',
		'th',
		'tl',
		'tr_TR',
		'tt_RU',
		'ug_CN',
		'uk',
		'ur',
		'uz_UZ',
		'vi',
		'yor',
		'zh_CN',
		'zh_HK',
		'zh_TW',
	] )(
		'should return a valid language tag with the same language for %s',
		( wordPressLocale ) => {
			const tag = getLocale( createGlobal( wordPressLocale ) );

			expect( () => new Intl.NumberFormat( tag ) ).not.toThrow();
			expect( tag.split( '-' )[ 0 ] ).toBe(
				wordPressLocale.split( '_' )[ 0 ]
			);
		}
	);

	it.each( [
		[ 'en_US', 'en-US' ],
		[ 'de_DE', 'de-DE' ],
		[ 'pt_BR', 'pt-BR' ],
		[ 'haw_US', 'haw-US' ],
		[ 'de_DE_formal', 'de-DE-formal' ],
	] )( 'should convert %s to %s', ( wordPressLocale, expected ) => {
		expect( getLocale( createGlobal( wordPressLocale ) ) ).toBe( expected );
	} );

	it( 'should remove trailing parts the browser does not accept', () => {
		expect( getLocale( createGlobal( 'pt_PT_ao90' ) ) ).toBe( 'pt-PT' );
	} );

	it.each( [ '12345_INVALID', 'site-default' ] )(
		'should return the browser language for the invalid locale %s',
		( invalidLocale ) => {
			expect( getLocale( createGlobal( invalidLocale ) ) ).toBe(
				'fr-CA'
			);
			expect( console ).toHaveWarned();
		}
	);

	it( 'should return the browser language for an empty locale', () => {
		expect( getLocale( createGlobal( '' ) ) ).toBe( 'fr-CA' );
	} );
} );
