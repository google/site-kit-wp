<?php
/**
 * PageSpeed_InsightsTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class PageSpeed_InsightsTest extends TestCase {

	public function test_is_connected() {
		$pagespeed = new PageSpeed_Insights( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $pagespeed->is_connected() );

		// The module is connected if the API key is truthy
		add_filter( 'googlesitekit_api_key', '__return_true' );

		$this->assertTrue( $pagespeed->is_connected() );
	}

	public function test_on_deactivation() {
		$pagespeed = new PageSpeed_Insights( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options   = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( PageSpeed_Insights::OPTION, 'test-value' );
		$this->assertEquals( 'test-value', $options->get( PageSpeed_Insights::OPTION ) );

		$pagespeed->on_deactivation();

		$this->assertFalse( $options->get( PageSpeed_Insights::OPTION ) );
	}

	public function test_prepare_info_for_js() {
		$pagespeed = new PageSpeed_Insights( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $pagespeed->prepare_info_for_js();

		$this->assertEqualSets(
			array(
				'slug',
				'name',
				'description',
				'cta',
				'sort',
				'homepage',
				'learnMore',
				'group',
				'feature',
				'module_tags',
				'required',
				'autoActivate',
				'screenId',
				'hasSettings',
				'provides',
			),
			array_keys( $info )
		);
		$this->assertEquals( 'pagespeed-insights', $info['slug'] );
	}

	public function test_get_datapoints() {
		$pagespeed = new PageSpeed_Insights( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'site-pagespeed-mobile',
				'site-pagespeed-desktop',
			),
			$pagespeed->get_datapoints()
		);
	}
}
