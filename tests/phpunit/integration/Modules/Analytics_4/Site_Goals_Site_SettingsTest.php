<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals_Site_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Site_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Site_Goals_Site_SettingsTest extends TestCase {

	/**
	 * Site_Goals_Site_Settings instance.
	 *
	 * @var Site_Goals_Site_Settings
	 */
	private $site_goals_site_settings;

	public function set_up() {
		parent::set_up();

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->site_goals_site_settings = new Site_Goals_Site_Settings( new Options( $context ) );
		$this->site_goals_site_settings->register();
	}

	public function test_remove_widget__takes_only_the_named_widget_out() {
		$this->site_goals_site_settings->merge( array( 'activeWidgets' => array( 'ecommerce', 'lead' ) ) );

		$settings = $this->site_goals_site_settings->remove_widget( 'lead' );

		$this->assertSame( array( 'ecommerce' ), $settings['activeWidgets'], 'The `remove_widget` method should return the remaining widgets.' );
		$this->assertSame( array( 'ecommerce' ), $this->site_goals_site_settings->get()['activeWidgets'], 'The `remove_widget` method should store the remaining widgets.' );
	}

	public function test_remove_widget__leaves_an_empty_list_when_the_last_widget_is_removed() {
		$this->site_goals_site_settings->merge( array( 'activeWidgets' => array( 'ecommerce' ) ) );

		$this->site_goals_site_settings->remove_widget( 'ecommerce' );

		$this->assertSame( array(), $this->site_goals_site_settings->get()['activeWidgets'], 'Removing the last widget should leave an empty list.' );
	}

	public function test_remove_widget__removes_the_first_widget_in_the_list() {
		$this->site_goals_site_settings->merge( array( 'activeWidgets' => array( 'ecommerce', 'lead' ) ) );

		$settings = $this->site_goals_site_settings->remove_widget( 'ecommerce' );

		$this->assertSame( array( 'lead' ), $settings['activeWidgets'], 'Removing the ecommerce widget should return only the lead widget.' );
	}

	public function test_remove_widget__changes_nothing_when_the_widget_is_not_active() {
		$this->site_goals_site_settings->merge( array( 'activeWidgets' => array( 'ecommerce' ) ) );

		$this->site_goals_site_settings->remove_widget( 'lead' );

		$this->assertSame( array( 'ecommerce' ), $this->site_goals_site_settings->get()['activeWidgets'], "Removing a widget that isn't active should leave the other widgets alone." );
	}

	public function test_merge__adds_a_widget_back_after_it_was_removed() {
		$this->site_goals_site_settings->merge( array( 'activeWidgets' => array( 'ecommerce', 'lead' ) ) );
		$this->site_goals_site_settings->remove_widget( 'lead' );

		$this->site_goals_site_settings->merge( array( 'activeWidgets' => array( 'lead' ) ) );

		$this->assertEqualSets(
			array( 'ecommerce', 'lead' ),
			$this->site_goals_site_settings->get()['activeWidgets'],
			'The `merge` method should add a removed widget back.'
		);
	}
}
