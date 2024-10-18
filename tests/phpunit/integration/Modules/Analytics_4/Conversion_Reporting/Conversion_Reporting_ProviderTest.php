<?php
/**
 * Conversion_Reporting_ProviderTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Conversion_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Conversion_Reporting\Conversion_Reporting_Provider;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Conversion_Reporting
 */
class Conversion_Reporting_ProviderTest extends TestCase {

	protected $settings;
	protected $user_options;
	protected $analytics_4;
	protected $context;

	public function set_up() {
		parent::set_up();

		remove_all_actions( 'load-toplevel_page_googlesitekit-dashboard' );

		$context = new Context( __FILE__ );
		$options = new Options( $context );

		$this->settings = new Settings( $options );
		$this->settings->register();

		$this->user_options = new User_Options( $context );

		$this->analytics_4 = new Analytics_4( $context, $options, $this->user_options );

		$this->context = $context;
	}

	public function test_register() {
		$provider = new Conversion_Reporting_Provider(
			$this->context,
			$this->settings,
			$this->user_options,
			$this->analytics_4
		);

		$provider->register();

		$this->assertTrue( has_action( 'load-toplevel_page_googlesitekit-dashboard' ) );
	}
}
