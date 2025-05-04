<?php
/**
 * Class Google\Site_Kit\Core\Tags\GTag
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Settings;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class to handle gtag rendering across modules.
 *
 * @since 1.124.0
 * @access public
 * @ignore
 */
class GTag {
	use Method_Proxy_Trait;

	const HANDLE = 'google_gtagjs';

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Holds an array of gtag ID's and their inline config elements.
	 *
	 * @var array $tags Array of tag ID's and their configs.
	 */
	private $tags = array();
	/**
	 * Holds an array of gtag commands, their parameters and command positions.
	 *
	 * @var array $commands Array of gtag config commands.
	 */
	private $commands = array();

	/**
	 * Constructor.
	 *
	 * @since 1.142.0
	 *
	 * @param Options $options Option API instance.
	 */
	public function __construct( Options $options ) {
		$this->options = $options;
	}

	/**
	 * Register method called after class instantiation.
	 *
	 * @since 1.124.0
	 * @access public
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', $this->get_method_proxy( 'enqueue_gtag_script' ), 20 );

		add_filter(
			'wp_resource_hints',
			function ( $urls, $relation_type ) {
				if ( 'dns-prefetch' === $relation_type ) {
					$urls[] = '//www.googletagmanager.com';
				}

				return $urls;
			},
			10,
			2
		);
	}

	/**
	 * Method to add a gtag ID and config for output rendering.
	 *
	 * @since 1.124.0
	 * @access public
	 *
	 * @param string $tag_id The gtag ID.
	 * @param array  $config Array of inline gtag config values.
	 *
	 * @return void
	 */
	public function add_tag( $tag_id, $config = array() ) {
		$this->tags[] = array(
			'tag_id' => $tag_id,
			'config' => $config,
		);
	}

	/**
	 * Method to add a gtag command, associated parameters and output position.
	 *
	 * @since 1.124.0
	 * @access public
	 *
	 * @param string $command    The gtag command to add.
	 * @param array  $parameters Array of command parameters.
	 * @param string $position   Position of command. "before|after".
	 *
	 * @return void
	 */
	public function add_command( $command, $parameters, $position = 'after' ) {
		$this->commands[] = array(
			'command'    => $command,       // e.g. 'config', 'event', etc.
			'parameters' => $parameters,    // e.g. array( 'send_to', 'AW-123456789' ).
			'position'   => $position,      // e.g. 'after', 'before'. This determines the position of the inline script relative to the gtag.js script.
		);
	}

	/**
	 * Method used to enqueue the gtag script along with additional tags,
	 * configs and commands.
	 *
	 * @since 1.124.0
	 * @access protected
	 *
	 * @return void
	 */
	protected function enqueue_gtag_script() {
		// $this->tags and $this->commands will be populated via this action's handlers.
		do_action( 'googlesitekit_setup_gtag', $this );

		if ( empty( $this->tags ) ) {
			return;
		}

		$gtag_src = $this->get_gtag_src();

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script( self::HANDLE, $gtag_src, false, null, false );
		wp_script_add_data( self::HANDLE, 'script_execution', 'async' );

		// Note that `gtag()` may already be defined via the `Consent_Mode` output, but this is safe to call multiple times.
		wp_add_inline_script( self::HANDLE, 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}' );

		foreach ( $this->commands as $command ) {
			wp_add_inline_script( self::HANDLE, $this->get_gtag_call_for_command( $command ), $command['position'] );
		}

		wp_add_inline_script( self::HANDLE, 'gtag("js", new Date());' );
		wp_add_inline_script( self::HANDLE, 'gtag("set", "developer_id.dZTNiMT", true);' ); // Site Kit developer ID.

		foreach ( $this->tags as $tag ) {
			wp_add_inline_script( self::HANDLE, $this->get_gtag_call_for_tag( $tag ) );
		}

		$filter_google_gtagjs = function ( $tag, $handle ) {
			if ( self::HANDLE !== $handle ) {
				return $tag;
			}

			$snippet_comment_begin = sprintf( "\n<!-- %s -->\n", esc_html__( 'Google tag (gtag.js) snippet added by Site Kit', 'google-site-kit' ) );
			$snippet_comment_end   = sprintf( "\n<!-- %s -->\n", esc_html__( 'End Google tag (gtag.js) snippet added by Site Kit', 'google-site-kit' ) );

			return $snippet_comment_begin . $tag . $snippet_comment_end;
		};

		add_filter( 'script_loader_tag', $filter_google_gtagjs, 20, 2 );
	}

	/**
	 * Method used to return gtag() config call for selected tag.
	 *
	 * @since 1.124.0
	 * @access protected
	 *
	 * @param array $tag The Gtag tag, along with its config parameters.
	 *
	 * @return string Gtag call for tag in question.
	 */
	protected function get_gtag_call_for_tag( $tag ) {
		return empty( $tag['config'] )
			? sprintf( 'gtag("config", "%s");', esc_js( $tag['tag_id'] ) )
			: sprintf( 'gtag("config", "%s", %s);', esc_js( $tag['tag_id'] ), wp_json_encode( $tag['config'] ) );
	}

	/**
	 * Method used to return gtag call for specific command.
	 *
	 * @since 1.124.0
	 * @access protected
	 *
	 * @param array $command The command array with applicable command and params.
	 *
	 * @return string Gtag function call for specific command.
	 */
	protected function get_gtag_call_for_command( $command ) {
		$gtag_args = array_merge( array( $command['command'] ), $command['parameters'] );
		$gtag_args = array_map(
			function ( $arg ) {
				return wp_json_encode( $arg );
			},
			$gtag_args
		);

		return sprintf( 'gtag(%s);', implode( ',', $gtag_args ) );
	}

	/**
	 * Returns the gtag source URL.
	 *
	 * @since 1.124.0
	 * @since 1.142.0 Provides support for First-party mode.
	 *
	 * @return string|false The gtag source URL. False if no tags are added.
	 */
	public function get_gtag_src() {
		if ( empty( $this->tags ) ) {
			return false;
		}

		// Load the GTag scripts using the first tag ID - it doesn't matter which is used,
		// all registered tags will be set up with a config command regardless
		// of which is used to load the source.
		$tag_id = rawurlencode( $this->tags[0]['tag_id'] );

		// If First-party mode is active, use the proxy URL to load the GTag script.
		if ( Feature_Flags::enabled( 'firstPartyMode' ) && $this->is_first_party_mode_active() ) {
			return add_query_arg(
				array(
					'id' => $tag_id,
					's'  => '/gtag/js',
				),
				plugins_url( 'fpm/measurement.php', GOOGLESITEKIT_PLUGIN_MAIN_FILE )
			);
		}

		return 'https://www.googletagmanager.com/gtag/js?id=' . $tag_id;
	}

	/**
	 * Checks if First-party mode is active.
	 *
	 * @since 1.142.0
	 *
	 * @return bool True if First-party mode is active, false otherwise.
	 */
	protected function is_first_party_mode_active() {
		$first_party_mode_settings = new First_Party_Mode_Settings( $this->options );

		$settings = $first_party_mode_settings->get();

		$required_settings = array( 'isEnabled', 'isFPMHealthy', 'isScriptAccessEnabled' );

		foreach ( $required_settings as $setting ) {
			if ( ! isset( $settings[ $setting ] ) || ! $settings[ $setting ] ) {
				return false;
			}
		}

		return true;
	}
}
