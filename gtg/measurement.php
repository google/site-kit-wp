<?php

/**
 * GoogleTagGatewayServing redirect file
 *
 * @package   Google\GoogleTagGatewayLibrary
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 *
 * @version   1bd3cfb
 *
 * NOTICE: This file has been modified from its original version in accordance with the Apache License, Version 2.0.
 */

// This file should run in isolation from any other PHP file. This means using
// minimal to no external dependencies, which leads us to suppressing the
// following linting rules:
//
// phpcs:disable PSR1.Files.SideEffects.FoundWithSymbols
// phpcs:disable PSR1.Classes.ClassDeclaration.MultipleClasses

namespace Google\GoogleTagGatewayLibrary;

/* Start of Site Kit modified code. */
if ( isset( $_GET['healthCheck'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
	echo 'ok';
	exit;
}
/* End of Site Kit modified code. */

/** Core measurement.php logic. */
final class Measurement
{
    private const TAG_ID_QUERY = '?id=';
    private const GEO_QUERY = '&geo=';
    private const PATH_QUERY = '&s=';
    private const FPS_PATH = 'PHP_GTG_REPLACE_PATH';

    private RequestHelper $helper;

    /**
     * Create the measurement request handler.
     *
     * @param RequestHelper $helper
     */
    public function __construct(RequestHelper $helper)
    {
        $this->helper = $helper;
    }

    /** Run the measurement logic. */
    public function run()
    {
        $redirectorFile = $_SERVER['SCRIPT_NAME'] ?? '';
        $redirectorFile = RequestHelper::sanitizePathForUrl($redirectorFile);
        if (empty($redirectorFile)) {
            $this->helper->invalidRequest(500);
            return "";
        }

        $parameters = self::extractParameters();

        $tagId = $parameters['tag_id'];
        $path = $parameters['path'];
        $geo = $parameters['geo'];
        $mpath = $parameters['mpath'];

        if (empty($tagId) || empty($path)) {
            $this->helper->invalidRequest(400);
            return "";
        }

        $useMpath = empty($mpath) ? self::FPS_PATH : $mpath;

        $fpsUrl = 'https://' . $tagId . '.fps.goog/' . $useMpath . $path;

        $requestHeaders = $this->helper->getRequestHeaders();
        if (isset($_SERVER['REMOTE_ADDR'])) {
            $requestHeaders[] = "x-forwarded-for: {$_SERVER['REMOTE_ADDR']}";
        }
        if (!empty($geo)) {
            $requestHeaders[] = "x-forwarded-countryregion: {$geo}";
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $body = $this->helper->getRequestBody() ?? '';

        $response = $this->helper->sendRequest(
            $method,
            $fpsUrl,
            $requestHeaders,
            $body
        );

        if ($useMpath === self::FPS_PATH) {
            $substitutionMpath = $redirectorFile . self::TAG_ID_QUERY . $tagId;
            if (!empty($geo)) {
                $substitutionMpath .= self::GEO_QUERY . $geo;
            }
            $substitutionMpath .= self::PATH_QUERY;

            if (self::isScriptResponse($response['headers'])) {
                $response['body'] = str_replace(
                    '/' . self::FPS_PATH . '/',
                    $substitutionMpath,
                    $response['body']
                );
            } elseif (self::isRedirectResponse($response['statusCode']) && !empty($response['headers'])) {
                foreach ($response['headers'] as $refKey => $header) {
                    // Ensure we are only processing strings.
                    if (!is_string($header)) {
                        continue;
                    }

                    $headerParts = explode(':', $response['headers'][$refKey], 2);
                    if (count($headerParts) !== 2) {
                        continue;
                    }
                    $key = trim($headerParts[0]);
                    $value = trim($headerParts[1]);
                    if (strtolower($key) !== 'location') {
                        continue;
                    }

                    $newValue = str_replace(
                        '/' . self::FPS_PATH,
                        $substitutionMpath,
                        $value
                    );
                    $response['headers'][$refKey] = "{$key}: {$newValue}";
                    break;
                }
            }
        }
        return $response;
    }

    /**
     * @param string[] $headers
     */
    private static function isScriptResponse(array $headers): bool
    {
        if (empty($headers)) {
            return false;
        }

        foreach ($headers as $header) {
            if (empty($header)) {
                continue;
            }

            $normalizedHeader = strtolower(str_replace(' ', '', $header));
            if (strpos($normalizedHeader, 'content-type:application/javascript') === 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if the response is a redirect response.
     * @param int $statusCode
     */
    private static function isRedirectResponse(int $statusCode): bool
    {
        return $statusCode >= 300 && $statusCode < 400;
    }

    /**
     * Extract the the tag ID, request path, geo location, and measurement path
     * from the current request context.
     *
     * @return array{
     *      'tag_id': string,
     *      'path': string,
     *      'geo': string,
     *      'mpath': string,
     * } The request parameters extracted.
     */
    private static function extractParameters(): array
    {
        $get = $_GET;
        if (empty($get)) {
            return array(
                "tag_id" => '',
                "path" => '',
                "geo" => '',
                "mpath" => '',
            );
        }

        $tagId = $get['id'] ?? '';
        $path = $get['s'] ?? '';
        $geo = $get['geo'] ?? '';
        $mpath = $get['mpath'] ?? '';

        // When measurement path is present it might accidentally pass an empty
        // path character depending on how the url rules are processed so as a
        // safety when path is empty we should assume that it is a request to
        // the root.
        if (empty($path)) {
            $path = '/';
        }

        // Validate tagId
        if (!preg_match('/^[A-Za-z0-9-]*$/', $tagId)) {
            return array(
                "tag_id" => '',
                "path" => '',
                "geo" => '',
                "mpath" => '',
            );
        }

        // Basic Geo validation
        if (!preg_match('/^[A-Za-z0-9-]*$/', $geo)) {
            $geo = '';
        }

        unset($get['id'], $get['s'], $get['geo'], $get['mpath']);

        if (!empty($get)) {
            $containsQueryParameters = strpos($path, '?') !== false;
            $paramSeparator = $containsQueryParameters ? '&' : '?';
            $path .= $paramSeparator .
                http_build_query($get, '', '&', PHP_QUERY_RFC3986);
        }

        return array(
            "tag_id" => $tagId,
            "path" => $path,
            "geo" => $geo,
            "mpath" => $mpath,
        );
    }
}

// REQUEST_HELPER_START
/**
 * NOTE: DO NOT edit RequestHelper directly nor remove the start and end tags.
 *
 * This class is copied over from src/RequestHelper.php. If any changes are
 * needed, change that file and run the command `npm run copy:RequestHelper`.
 */
/**
 * Isolates network requests and other methods like exit to inject into classes.
 */
class RequestHelper
{
    private static $reservedHeaders = [
        # PHP managed headers which will be auto populated by curl or file_get_contents.
        'HTTP_ACCEPT_ENCODING' => true,
        'HTTP_CONNECTION' => true,
        'HTTP_CONTENT_LENGTH' => true,
        'HTTP_EXPECT' => true,
        'HTTP_HOST' => true,
        'HTTP_TRANSFER_ENCODING' => true,
        # Sensitive headers to exclude from all requests.
        'HTTP_AUTHORIZATION' => true,
        'HTTP_PROXY_AUTHORIZATION' => true,
        'HTTP_X_API_KEY' => true,
    ];

    /**
     * Helper method to exit the script early and send back a status code.
     *
     * @param int $statusCode
     */
    public function invalidRequest(int $statusCode): void
    {
        http_response_code($statusCode);
        exit();
    }

    /**
     * Set the headers from a headers array.
     *
     * @param string[] $headers
     */
    public function setHeaders(array $headers): void
    {
        foreach ($headers as $header) {
            if (!empty($header)) {
                header($header);
            }
        }
    }

    /**
     * Get headers from the current request as an array of strings.
     * Similar to how you set headers using the `headers` function.
     */
    public function getRequestHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            # Skip reserved headers
            if (isset(self::$reservedHeaders[$key])) {
                continue;
            }

            # All PHP request headers are available under the $_SERVER variable
            # and have a key prefixed with `HTTP_` according to:
            # https://www.php.net/manual/en/reserved.variables.server.php#refsect1-reserved.variables.server-description
            if (substr($key, 0, 5) !== 'HTTP_') {
                continue;
            }

            # PHP defaults to every header key being all capitalized.
            # Format header key as lowercase with `-` as word separator.
            # For example: cache-control
            $headerKey = strtolower(str_replace('_', '-', substr($key, 5)));

            if (empty($headerKey) || empty($value)) {
                continue;
            }

            $headers[] = "$headerKey: $value";
        }
        return $headers;
    }

    /**
     * Sanitizes a path to a URL path.
     *
     * This function performs two critical actions:
     * 1. Extract ONLY the path component, discarding any scheme, host, port,
     *    user, pass, query, or fragment.
     *    Primary defense against Server-Side Request Forgery (SSRF).
     * 2. Normalize the path to resolve directory traversal segments like
     *    '.' and '..'.
     *    Prevents path traversal attacks.
     *
     * @param string $pathInput The raw path string.
     * @return string|false The sanitized and normalized URL path.
     */
    public static function sanitizePathForUrl(string $pathInput): string
    {
        if (empty($pathInput)) {
            return false;
        }
        // Normalize directory separators to forward slashes for Windows like directories.
        $path = str_replace('\\', '/', $pathInput);

        // 2. Normalize the path to resolve '..' and '.' segments.
        $parts = [];
        // Explode the path into segments. filter removes empty segments (e.g., from '//').
        $segments = explode('/', trim($path, '/'));

        foreach ($segments as $segment) {
            if ($segment === '.' || $segment === '') {
                // Ignore current directory and empty segments.
                continue;
            }
            if ($segment === '..') {
                // Go up one level by removing the last part.
                if (array_pop($parts) === null) {
                    // If we try and traverse too far back, outside of the root
                    // directory, this is likely an invalid configuration so
                    // return false to have caller handle this error.
                    return false;
                }
            } else {
                // Add the segment to our clean path.
                $parts[] = rawurlencode($segment);
            }
        }

        // Rebuild the final path.
        $sanitizedPath = implode('/', $parts);

        return '/' . $sanitizedPath;
    }

    /**
     * Fetch the current request's request body.
     *
     * @return string The current request body.
     */
    public function getRequestBody(): string
    {
        return file_get_contents("php://input");
    }

    /**
     * Helper method to send requests depending on the PHP environment.
     *
     * @param string $method
     * @param string $url
     * @param array $headers
     * @param string $body
     *
     * @return array{
     *      body: string,
     *      headers: string[],
     *      statusCode: int,
     * }
     */
    public function sendRequest(
        string $method,
        string $url,
        array $headers = [],
        ?string $body = null
    ): array {
        if ($this->isCurlInstalled()) {
            $response = $this->sendCurlRequest($method, $url, $headers, $body);
        } else {
            $response = $this->sendFileGetContents($method, $url, $headers, $body);
        }
        return $response;
    }

    /**
     * Send a request using curl.
     *
     * @param string $method
     * @param string $url
     * @param array $headers
     * @param string $body
     *
     * @return array{
     *      body: string,
     *      headers: string[],
     *      statusCode: int,
     * }
     */
    protected function sendCurlRequest(
        string $method,
        string $url,
        array $headers = [],
        ?string $body = null
    ): array {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_URL, $url);

        $method = strtoupper($method);
        switch ($method) {
            case 'GET':
                curl_setopt($ch, CURLOPT_HTTPGET, true);
                break;
            case 'POST':
                curl_setopt($ch, CURLOPT_POST, true);
                break;
            default:
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
                break;
        }

        if (!empty($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        if (!empty($body)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $result = curl_exec($ch);

        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headersString = substr($result, 0, $headerSize);
        $headers = explode("\r\n", $headersString);
        $headers = $this->normalizeHeaders($headers);

        $body = substr($result, $headerSize);

        curl_close($ch);

        return array(
            'body' => $body,
            'headers' => $headers,
            'statusCode' => $statusCode,
        );
    }

    /**
     * Send a request using file_get_contents.
     *
     * @param string $method
     * @param string $url
     * @param array $headers
     * @param string $body
     *
     * @return array{
     *      body: string,
     *      headers: string[],
     *      statusCode: int,
     * }
     */
    protected function sendFileGetContents(
        string $method,
        string $url,
        array $headers = [],
        ?string $body = null
    ): array {
        $httpContext = [
            'method' => strtoupper($method),
            'follow_location' => 0,
            'max_redirects' => 0,
            'ignore_errors' => true,
        ];
        if (!empty($headers)) {
            $httpContext['header'] = implode("\r\n", $headers);
        }
        if (!empty($body)) {
            $httpContext['content'] = $body;
        }

        $streamContext = stream_context_create(['http' => $httpContext]);

        // Calling file_get_contents will set the variable $http_response_header
        // within the local scope.
        $result = file_get_contents($url, false, $streamContext);

        /** @var string[] $headers */
        $headers = $http_response_header ?? [];

        $statusCode = 200;
        if (!empty($headers)) {
            // The first element in the headers array will be the HTTP version
            // and status code used, parse out the status code and remove this
            // value from the headers.
            preg_match('/HTTP\/\d\.\d\s+(\d+)/', $headers[0], $statusHeader);
            $statusCode = intval($statusHeader[1]) ?? 200;
        }
        $headers = $this->normalizeHeaders($headers);

        return array(
            'body' => $result,
            'headers' => $headers,
            'statusCode' => $statusCode,
        );
    }

    protected function isCurlInstalled(): bool
    {
        return extension_loaded('curl');
    }

    /** @param string[] $headers */
    protected function normalizeHeaders(array $headers): array
    {
        if (empty($headers)) {
            return $headers;
        }

        // The first element in the headers array will be the HTTP version
        // and status code used, this value is not needed in the headers.
        array_shift($headers);
        return $headers;
    }
}
// REQUEST_HELPER_END

// Skip initial run for testing
if (!defined('IS_GOOGLE_TAG_GATEWAY_TEST')) {
    $requestHelper = new RequestHelper();
    $response = (new Measurement($requestHelper))->run();

    $requestHelper->setHeaders($response['headers']);
    http_response_code($response['statusCode']);
    echo $response['body'];
}
