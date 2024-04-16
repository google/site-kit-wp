<?php
/**
 * AMP_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Ads;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class AMP_TagTest extends TestCase {
	use Module_With_Settings_ContractTests;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Ads object.
	 *
	 * @var Ads
	 */
	private $ads;

	/**
	 * Conversion ID.
	 *
	 */
	const CONVERSION_ID = 'AW-12345';

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return $this->ads;
	}

	/**
	 * Return the parsed AMP JSON config from the AMP tag HTML.
	 */
	protected function parse_amp_config_from_html( $html ) {
		$dom = new \DOMDocument();
		$dom->loadHTML( $html, LIBXML_NOERROR );
		$amp_tag  = $dom->getElementsByTagName( 'amp-analytics' )->item( 0 );
		$script   = $amp_tag->firstChild;
		$raw_json = $script->nodeValue;

		return json_decode( $raw_json, true );
	}

	public function set_up() {
		parent::set_up();

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $this->context );
		$this->ads     = new Ads( $this->get_amp_primary_context(), $this->options );
		$this->ads->get_settings()->set(
			array(
				'conversionID' => static::CONVERSION_ID,
			)
		);
		remove_all_actions( 'wp_enqueue_scripts' );
	}

	public function test_amp_ads_tag_is_present() {
		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_footer' );

		$this->ads->register();

		do_action( 'template_redirect' );

		$output = $this->capture_action( 'wp_footer' );

		$this->assertStringContainsString( '<amp-analytics', $output );
	}

	public function test_amp_ads_tag_contains_expected_tag_id() {
		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_footer' );

		$this->ads->register();

		do_action( 'template_redirect' );

		$output = $this->capture_action( 'wp_footer' );

		$parsed_config = $this->parse_amp_config_from_html( $output );

		$this->assertEquals( $parsed_config['vars']['gtag_id'], static::CONVERSION_ID );
	}

	public function test_amp_ads_tag_contains_linker_domain() {
		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_footer' );

		$this->ads->register();

		do_action( 'template_redirect' );

		$output = $this->capture_action( 'wp_footer' );

		$parsed_config = $this->parse_amp_config_from_html( $output );

		$this->assertEquals(
			$parsed_config['vars']['config']['linker']['domains'],
			array( 'example.org' )
		);
	}
}
