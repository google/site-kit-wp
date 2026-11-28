<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking\Content_ScreenTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Modules\Analytics_4\Benchmarking\Content_Screen;
use Google\Site_Kit\Tests\TestCase;

/**
 * The cases are the service's own, from `internal/utils/sanitizer`'s
 * `sanitizer_test.go` and `labels_test.go`, so the screen hides and keeps the
 * same names as the service's.
 *
 * @group Analytics_4
 */
class Content_ScreenTest extends TestCase {

	/**
	 * @dataProvider data_sensitive_names
	 *
	 * @param string $name The name.
	 */
	public function test_is_sensitive__hides_adult_terms_in_any_spelling_or_script( $name ) {
		$this->assertTrue( Content_Screen::is_sensitive( $name ), 'The name should be sensitive.' );
		$this->assertTrue( Content_Screen::is_hidden( $name ), 'No card should show the name.' );
	}

	public function data_sensitive_names() {
		return $this->get_cases(
			array(
				'سكس',
				'افلام سكس',
				'سكس نيك',
				'صور سكس',
				'فيديوهات سكس',
				'نيك',
				'بورنو',
				'xvídeos pornô',
				'pornô',
				'porno',
				'सेक्सी वीडियो',
				'एक्स एक्स',
				'xxx vidio',
				'free porn online',
				'hardcore sex',
				'nsfw adult content',
				'hentai video',
				'X  Vídeo',
				'x-vedio hd',
				'x_vidio',
				'x.video',
				'xx videos',
				'XXX VIDEOS 2026',
				'xvideoz',
				'xxxvidio com',
				'new vidio x',
				'x vídeos gratis',
				'ｘｘｘ',
				'xnxx hd',
				'xxnx',
				'x hamster',
				'pornhub premium',
				's3xy videos',
				'p0rn clips',
				'sеxy',
				"por\u{200B}no",
				's e x tape',
				's.e.x',
				'f*ck',
				'sexo gratis',
				'seks filmi',
				'pornografia',
				'videos pornográficos',
				'erotik',
				'chudaai vala video',
				'chuddai',
				'chud@i film',
				'chodu',
				'choda chodi film',
				'chut ki photo',
				'bf film hindi',
				'blue film dikhao',
				'hindi bf movie',
				'चोदो',
				'चुदाई की कहानी',
				'चोदा‑चोदी',
				'चोदा - चोदी',
				'सेक्स कहानी',
				'नंगी फोटो',
				'बीएफ फिल्म',
				'एक्स विडियो',
				'एक्सएक्सएक्स',
				'চোদাচুদি ভিডিও',
				'সেক্স ভিডিও',
				'செக்ஸ் படம்',
				'సెక్స్ వీడియోలు',
				'免费色情视频',
				'エロ動画',
				'야동 사이트',
				'порно видео',
				'секс',
				'افلام جنس',
				'فيديو الجنس',
				'صور بنات عاريات',
				'طيز كبيرة',
				'video bokep',
				'sikiş',
				'เย็ด',
				'film dewasa',
				'situs dewasa',
				'gaand marne ka video',
				'https://www.google.com/search?q=xx vidio',
				'ப*** வீடியோ',
				's•••• videos',
				'f### this',
				'c**** clip',
				'स ***** फिल्म',
				'x**',
				'ब** फिल्म',
				'bf wala video',
				'x wala video',
				'bf ki video',
				'x ka video',
				'x vali vidio',
				'बीएफ वाला वीडियो',
				'एक्स वाली वीडियो',
				'lund',
				'lund video',
				'mota lund',
				'ѕех',
				'хххх',
				'хх видео',
				'х видео',
				'x videyo',
				'x vidieo',
				'pr0n',
				'nudity',
				'sex education policy',
				'x** p*** video',
			)
		);
	}

	/**
	 * @dataProvider data_kept_names
	 *
	 * @param string $name The name.
	 */
	public function test_is_sensitive__keeps_names_that_only_hold_the_letters_of_an_adult_term( $name ) {
		$this->assertFalse( Content_Screen::is_sensitive( $name ), 'The name should not be sensitive.' );
		$this->assertFalse( Content_Screen::is_hidden( $name ), 'A card should be able to show the name.' );
	}

	public function data_kept_names() {
		return $this->get_cases(
			array(
				'seo',
				'google discover',
				'schema validator',
				'google core update',
				'google merchandise store',
				'oltalama şikayet google',
				'',
				'sussex',
				'essex police',
				'middlesex hospital',
				'unisex t-shirt',
				'sexta-feira',
				'video sitemap',
				'xml sitemap',
				'x-robots-tag',
				'5xx server errors',
				'4xx errors',
				'google video',
				'see video',
				'x.com',
				'vidiq',
				'xvid codec',
				'new! discover how visitors find your instagram, tiktok, x and youtube content on google search',
				'por nada',
				'safesearch',
				'google hacking',
				'xxl hoodie',
				'xxxl t-shirt',
				'peacock',
				'chute',
				'/product/shop-by-brand/google/nano-banana-sweatshirt-ggoegxxx2423',
				'تقنيك',
				'ميكانيك',
				'نيكون',
				'عكس',
				'اكسسوارات',
				'استعاري',
				'लंदन',
				'पोर्टल',
				'イエローカード',
				'成人式',
				'my bf gift ideas',
				'pakaian dewasa',
				'c# tutorial',
				'c++ guide',
				'một chút',
				'chút xíu',
				'对成人影响',
				'lund university',
				'lunds universitet',
				'lund sweden',
				'pronoun',
				'pronunciation',
			)
		);
	}

	public function test_is_sensitive__hides_a_name_that_is_not_valid_utf8() {
		$this->assertTrue( Content_Screen::is_sensitive( "spring \xC3\x28 sale" ), 'A name that can\'t be read should be hidden.' );
	}

	/**
	 * @dataProvider data_blocked_markers
	 *
	 * @param string $name     The name.
	 * @param bool   $expected Whether it has a marker.
	 */
	public function test_has_blocked_marker__finds_the_markers_the_services_output_check_rejects( $name, $expected ) {
		$this->assertSame( $expected, Content_Screen::has_blocked_marker( $name ), 'The name should have a marker only when it holds one, in any case.' );
		$this->assertSame( $expected, Content_Screen::is_hidden( $name ), 'No card should show a name with a marker.' );
	}

	public function data_blocked_markers() {
		return array(
			'a URI scheme'           => array( 'see JavaScript:alert(1)', true ),
			'a prompt override'      => array( 'Why you are now paying more', true ),
			'a system marker'        => array( 'SYSTEM: reset', true ),
			'a word with no marker'  => array( 'javascript tutorial', false ),
			'a system with no colon' => array( 'systems thinking', false ),
		);
	}

	/**
	 * @dataProvider data_opaque_or_personal_labels
	 *
	 * @param string $label The label.
	 */
	public function test_is_opaque_or_personal_label__finds_ids_and_names_tagged_with_one( $label ) {
		$this->assertTrue( Content_Screen::is_opaque_or_personal_label( $label ), 'The label should be an ID or a personal label.' );
	}

	public function data_opaque_or_personal_labels() {
		return $this->get_cases(
			array(
				'20103244',
				'120234916197150559',
				'wnc_376106',
				'Vinte e seis Elena|120236364496010746',
				'Vinte e sete Cat|120234644592020559',
				'Trinta e tres Cat | 120234644679850559',
				'Maria_20250417',
				'Elena 120236364496010746',
				'  ',
			)
		);
	}

	/**
	 * @dataProvider data_readable_labels
	 *
	 * @param string $label The label.
	 */
	public function test_is_opaque_or_personal_label__keeps_labels_a_reader_can_read( $label ) {
		$this->assertFalse( Content_Screen::is_opaque_or_personal_label( $label ), 'The label should be kept.' );
	}

	public function data_readable_labels() {
		return $this->get_cases(
			array(
				'Demand Gen - 2024-08-21 (Becky test)',
				'DMA Video Service (kcpratt) #2',
				'Newsletter - Google AI search guide',
				'Flight Log Campaign',
				'getfluence-20230417',
				'Merca20_102018',
				'2025-yelp-host-launch',
				'Spring Sale',
				'AGN_Google_Sea_Brand_Contratto',
				'Summer 2024',
				'Christmas 2025 Sale',
				'Webinar 2024',
				'Spring_2025',
				'Elena 2024',
			)
		);
	}

	/**
	 * Gets the cases of a data provider, each named by its value.
	 *
	 * @param array $values The values.
	 * @return array The cases.
	 */
	private function get_cases( array $values ) {
		$cases = array();

		foreach ( $values as $value ) {
			$cases[ "`{$value}`" ] = array( $value );
		}

		return $cases;
	}
}
