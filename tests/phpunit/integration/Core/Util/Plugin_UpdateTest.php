<?php
/**
 * Plugin_UpdateTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Plugin_Update;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Plugin_UpdateTest extends TestCase {

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();

		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $context );

		$this->options->delete( Plugin_Update::VERSION_OPTION );

		// The plugin registered its own instance at bootstrap, which would write the option before
		// the test reaches it.
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'upgrader_process_complete' );
		remove_all_actions( Plugin_Update::CRON_ACTION );

		wp_clear_scheduled_hook( Plugin_Update::CRON_ACTION );

		( new Plugin_Update( $context, $this->options ) )->register();
	}

	public function tear_down() {
		wp_clear_scheduled_hook( Plugin_Update::CRON_ACTION );

		parent::tear_down();
	}

	/**
	 * Fires the upgrader action the way WordPress does once an update has finished.
	 *
	 * @param array $hook_extra Arguments describing what was updated.
	 */
	private function complete_upgrade( $hook_extra ) {
		do_action( 'upgrader_process_complete', null, $hook_extra );
	}

	/**
	 * Counts the events scheduled for the version cron action.
	 *
	 * `wp_next_scheduled()` only reports the first one, which cannot tell a single event from
	 * several queued at different times.
	 *
	 * @return int Number of scheduled events.
	 */
	private function count_scheduled_events() {
		$count = 0;

		foreach ( (array) _get_cron_array() as $timestamp_events ) {
			if ( isset( $timestamp_events[ Plugin_Update::CRON_ACTION ] ) ) {
				$count += count( $timestamp_events[ Plugin_Update::CRON_ACTION ] );
			}
		}

		return $count;
	}

	public function test_admin_init__stores_the_version_on_a_site_that_has_none() {
		do_action( 'admin_init' );

		$this->assertEquals( GOOGLESITEKIT_VERSION, $this->options->get( Plugin_Update::VERSION_OPTION ), 'The running version should be stored.' );
	}

	public function test_admin_init__replaces_an_older_version() {
		$this->options->set( Plugin_Update::VERSION_OPTION, '1.0.0' );

		do_action( 'admin_init' );

		$this->assertEquals( GOOGLESITEKIT_VERSION, $this->options->get( Plugin_Update::VERSION_OPTION ), 'The stored version should be replaced by the running one.' );
	}

	public function test_admin_init__leaves_a_matching_version_alone() {
		$this->options->set( Plugin_Update::VERSION_OPTION, GOOGLESITEKIT_VERSION );

		$written = 0;
		add_action(
			'update_option_' . Plugin_Update::VERSION_OPTION,
			function () use ( &$written ) {
				$written++;
			}
		);

		do_action( 'admin_init' );

		$this->assertEquals( 0, $written, 'A version that already matches should not be written again.' );
	}

	public function test_admin_init__runs_after_the_migrations() {
		$this->options->set( Plugin_Update::VERSION_OPTION, '1.0.0' );

		$order = array();

		// Migrations hook the same action at the default priority, and one of them at priority 0.
		add_action(
			'admin_init',
			function () use ( &$order ) {
				$order[] = 'migration';
			}
		);

		add_action(
			'update_option_' . Plugin_Update::VERSION_OPTION,
			function () use ( &$order ) {
				$order[] = 'version';
			}
		);

		do_action( 'admin_init' );

		$this->assertEquals( array( 'migration', 'version' ), $order, 'The version should be written once the migrations have run.' );
	}

	public function test_upgrader_process_complete__schedules_after_a_single_plugin_update() {
		$this->complete_upgrade(
			array(
				'type'   => 'plugin',
				'action' => 'update',
				'plugin' => GOOGLESITEKIT_PLUGIN_BASENAME,
			)
		);

		$this->assertEquals( 1, $this->count_scheduled_events(), 'Updating the plugin on its own should schedule the version to be recorded.' );
	}

	public function test_upgrader_process_complete__schedules_after_a_bulk_update() {
		$this->complete_upgrade(
			array(
				'type'    => 'plugin',
				'action'  => 'update',
				'bulk'    => true,
				'plugins' => array( 'hello-dolly/hello.php', GOOGLESITEKIT_PLUGIN_BASENAME ),
			)
		);

		$this->assertEquals( 1, $this->count_scheduled_events(), 'A bulk update including the plugin should schedule the version to be recorded.' );
	}

	public function test_upgrader_process_complete__ignores_another_plugin() {
		$this->complete_upgrade(
			array(
				'type'   => 'plugin',
				'action' => 'update',
				'plugin' => 'hello-dolly/hello.php',
			)
		);

		$this->assertEquals( 0, $this->count_scheduled_events(), 'Updating an unrelated plugin should schedule nothing.' );
	}

	public function test_upgrader_process_complete__ignores_a_theme_update() {
		$this->complete_upgrade(
			array(
				'type'   => 'theme',
				'action' => 'update',
				'themes' => array( 'twentytwentyfive' ),
			)
		);

		$this->assertEquals( 0, $this->count_scheduled_events(), 'Updating a theme should schedule nothing.' );
	}

	public function test_upgrader_process_complete__ignores_a_fresh_install() {
		// WordPress reports an install without naming the plugin, so it is left to `admin_init`.
		$this->complete_upgrade(
			array(
				'type'   => 'plugin',
				'action' => 'install',
			)
		);

		$this->assertEquals( 0, $this->count_scheduled_events(), 'A fresh install should schedule nothing.' );
	}

	public function test_upgrader_process_complete__schedules_once_for_repeated_updates() {
		$hook_extra = array(
			'type'   => 'plugin',
			'action' => 'update',
			'plugin' => GOOGLESITEKIT_PLUGIN_BASENAME,
		);

		$this->complete_upgrade( $hook_extra );
		$this->complete_upgrade( $hook_extra );

		$this->assertEquals( 1, $this->count_scheduled_events(), 'A second update should not queue the version a second time.' );
	}

	public function test_cron__stores_the_running_version() {
		$this->options->set( Plugin_Update::VERSION_OPTION, '1.0.0' );

		do_action( Plugin_Update::CRON_ACTION );

		$this->assertEquals( GOOGLESITEKIT_VERSION, $this->options->get( Plugin_Update::VERSION_OPTION ), 'The cron event should store the running version.' );
	}
}
