<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\AMP_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class AMP_TagTest extends TestCase {

	/**
	 * Analytics module.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$this->analytics = new Analytics_4( $this->get_amp_primary_context() );
		$this->analytics->get_settings()->merge(
			array(
				'measurementID' => 'G-1234567',
				'useSnippet'    => true,
			)
		);
	}

	public function test_render__tag_id_attribute() {
		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_footer' );

		$this->analytics->register();

		do_action( 'template_redirect' );

		$output = $this->capture_action( 'wp_footer' );

		$this->assertMatchesRegularExpression(
			'/<amp-analytics [^>]*data-googlesitekit-tag="G-1234567"/',
			$output,
			'The amp-analytics element should have the measurement ID in its tag ID attribute.'
		);
		$this->assertStringContainsString( '<!-- Google Analytics AMP snippet added by Site Kit -->', $output, 'The AMP snippet should keep its opening comment.' );
		$this->assertStringContainsString( '<!-- End Google Analytics AMP snippet added by Site Kit -->', $output, 'The AMP snippet should keep its closing comment.' );
	}
}
