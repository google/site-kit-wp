<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Post_List_Column_PreferencesTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4\Post_List_Column_Preferences;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics
 */
class Post_List_Column_PreferencesTest extends TestCase {

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Post_List_Column_Preferences
	 */
	private $preferences;

	public function set_up(): void {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context            = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $context, $user_id );
		$this->preferences  = new Post_List_Column_Preferences( $this->user_options );
		$this->preferences->register();
	}

	public function test_get_metric_defaults_when_unset() {
		$this->assertSame(
			Post_List_Column_Preferences::DEFAULT_METRIC,
			$this->preferences->get_metric(),
			'Unset metric should fall back to default.'
		);
	}

	public function test_set_metric_rejects_invalid_value() {
		$this->preferences->set_metric( 'invalidMetric' );
		$this->assertSame(
			Post_List_Column_Preferences::DEFAULT_METRIC,
			$this->preferences->get_metric(),
			'Invalid metric should normalize to default.'
		);
	}

	public function test_set_metric_accepts_allowed_value() {
		$this->preferences->set_metric( 'sessions' );
		$this->assertSame( 'sessions', $this->preferences->get_metric(), 'Allowed metric should persist.' );
	}

	public function test_set_date_range_slug_rejects_invalid_value() {
		$this->preferences->set_date_range_slug( 'not-a-range' );
		$this->assertSame(
			Post_List_Column_Preferences::DEFAULT_DATE_RANGE,
			$this->preferences->get_date_range_slug(),
			'Invalid date range should normalize to default.'
		);
	}

	public function test_set_date_range_slug_accepts_allowed_value() {
		$this->preferences->set_date_range_slug( 'last-7-days' );
		$this->assertSame( 'last-7-days', $this->preferences->get_date_range_slug(), 'Allowed slug should persist.' );
	}
}
