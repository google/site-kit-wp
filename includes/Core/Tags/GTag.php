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
	 * Holds an array of gtag ID's and their inline config elements.
	 *
	 * @var array $tags Array of tag ID's and their configs.
	 */
	protected $tags = array();

	/**
	 * Holds an array of gtag commands, their parameters and command positions.
	 *
	 * @var array $commands Array of gtag config commands.
	 */
	protected $commands = array();

	protected $tag_handles = array();

	/**
	 * Register method called after class instantiation.
	 *
	 * @since 1.124.0
	 * @access public
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', fn() => $this->enqueue_gtag_script(), 20 );
		add_filter( 'script_loader_tag', $this->get_method_proxy( 'add_script_comments' ), 20, 2 );
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
		$this->set_developer_id();
		// $this->tags and $this->commands will be populated via this action's handlers.
		do_action( 'googlesitekit_setup_gtag', $this );

		$this->register_tags();
		$this->register_primary_script();

		wp_enqueue_script( self::HANDLE );
	}

	protected function set_developer_id() {
		$this->add_command( 'set', array( 'developer_id.dZTNiMT', true ) );
	}

	protected function register_tags() {
		if ( empty( $this->tags[0] ) ) {
			return;
		}
		// Load the GTag scripts using the first tag ID - it doesn't matter which is used,
		// all registered tags will be set up with a config command regardless
		// of which is used to load the source.
		$this->register_tag( $this->tags[0]['tag_id'] );
	}

	protected function register_tag( $tag_id ) {
		$handle = $this->get_handle_for_tag( $tag_id );

		wp_register_script(
			$handle,
			$this->get_tag_src( $tag_id ),
			array(),
			null,
		);
		// Use SK execution instead of WP strategy
		wp_script_add_data( $handle, 'script_execution', 'async' );

		$this->tag_handles[] = $handle;
	}

	/**
	 * @param $tag_id
	 *
	 * @return string
	 */
	public static function get_handle_for_tag( $tag_id ) {
		return self::HANDLE . '-' . $tag_id;
	}

	/**
	 * Returns the gtag source URL.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The gtag source URL.
	 */
	protected function get_tag_src( $tag_id ) {
		return 'https://www.googletagmanager.com/gtag/js?id=' . $tag_id;
	}

	protected function register_primary_script() {
		wp_register_script( self::HANDLE, false, $this->tag_handles );
		// Note that `gtag()` may already be defined via the `Consent_Mode` output, but this is safe to call multiple times.
		$this->add_inline_script( 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}' );
		$this->add_inline_script( 'gtag("js", new Date());' );

		foreach ( $this->commands as $command ) {
			$this->add_inline_script(
				$this->get_gtag_call_for_command( $command ),
				$command['position']
			);
		}

		foreach ( $this->tags as $tag ) {
			$this->add_inline_script( $this->get_gtag_call_for_tag( $tag ) );
		}
	}

	protected function add_inline_script( $data, $position = 'after' ) {
		wp_add_inline_script( self::HANDLE, $data, $position );
	}

	protected function add_script_comments( $tag, $handle ) {
		// Add the opening comment before the first tag.
		if ( isset( $this->tag_handles[0] ) && $handle === $this->tag_handles[0] ) {
			$comment_start = sprintf( "\n<!-- %s -->\n", esc_html__( 'Google tag (gtag.js) snippet added by Site Kit', 'google-site-kit' ) );
			return $comment_start . $tag;
		}

		// It isn't possible to add the closing comment since the snippet is an alias
		// so it does not pass through this filter.
		// The tag provided by Google also does not have a closing comment so this is consistent.

		return $tag;
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
}
