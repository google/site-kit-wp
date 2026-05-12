<?php
/**
 * Footer part shared across email templates.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array    $cta               Primary CTA configuration with 'url' and 'label'.
 * @var array    $footer            Footer configuration with 'copy' and 'unsubscribe_url'.
 * @var callable $render_shared_part Function to render a shared part by name.
 */

?>
<table role="presentation" width="100%" style="margin-top:12px;">
	<tr>
		<td style="text-align:center;">
			<?php if ( ! empty( $cta['url'] ) ) : ?>
				<div style="margin-top: 8px; margin-bottom:52px;">
					<?php
					$render_shared_part(
						'dashboard-link',
						array(
							'url'   => $cta['url'],
							'label' => isset( $cta['label'] ) ? $cta['label'] : __( 'View dashboard', 'google-site-kit' ),
						)
					);
					?>
				</div>
			<?php endif; ?>
			<?php if ( ! empty( $footer['copy'] ) ) : ?>
				<p class="text-secondary" style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; margin-bottom: 30px; text-align: left;">
					<?php
					if ( ! empty( $footer['unsubscribe_url'] ) ) {
						$unsubscribe_link = sprintf(
							'<a class="link" href="%s" style="text-decoration:none;">%s</a>',
							esc_url( $footer['unsubscribe_url'] ),
							esc_html__( 'here', 'google-site-kit' )
						);
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Link is escaped above.
						printf( '%s %s.', esc_html( $footer['copy'] ), $unsubscribe_link );
					} else {
						echo esc_html( $footer['copy'] );
					}
					?>
				</p>
			<?php endif; ?>
			<?php
			// Footer links are hardcoded to ensure consistent order across all email types.
			$footer_links = array();
			if ( ! empty( $footer['unsubscribe_url'] ) ) {
				$footer_links[] = array(
					'label' => __( 'Manage Subscription', 'google-site-kit' ),
					'url'   => $footer['unsubscribe_url'],
				);
			}
			$footer_links[] = array(
				'label' => __( 'Privacy Policy', 'google-site-kit' ),
				'url'   => 'https://policies.google.com/privacy',
			);
			$footer_links[] = array(
				'label' => __( 'Help Center', 'google-site-kit' ),
				'url'   => add_query_arg( 'doc', 'get-support', 'https://sitekit.withgoogle.com/support/' ),
			);

			$footer_links_count = count( $footer_links );
			$cell_width         = round( 100 / $footer_links_count, 2 ) . '%';
			$alignments         = 3 === $footer_links_count
				? array( 'left', 'center', 'right' )
				: array_fill( 0, $footer_links_count, 'center' );
			?>
			<table role="presentation" width="100%" style="font-size:12px; line-height:18px;">
				<tr>
					<?php
					foreach ( $footer_links as $index => $footer_link ) :
						$align = $alignments[ $index ] ?? 'center';
						?>
						<td width="<?php echo esc_attr( $cell_width ); ?>" style="text-align:<?php echo esc_attr( $align ); ?>;">
							<a class="text-secondary" href="<?php echo esc_url( $footer_link['url'] ); ?>" style="color:#6C726E; text-decoration:none; font-size:12px; line-height:16px; font-weight:500;" target="_blank" rel="noopener">
								<?php echo esc_html( $footer_link['label'] ); ?>
							</a>
						</td>
					<?php endforeach; ?>
				</tr>
			</table>
		</td>
	</tr>
</table>
