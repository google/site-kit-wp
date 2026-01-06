<?php

/**
 * GoogleTagGatewayServing measurement request proxy file
 *
 * @package   Google\GoogleTagGatewayLibrary\Proxy
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 *
 * @version   a8ee614
 *
 * NOTICE: This file has been modified from its original version in accordance with the Apache License, Version 2.0.
 */

// This file should run in isolation from any other PHP file. This means using
// minimal to no external dependencies, which leads us to suppressing the
// following linting rules:
//
// phpcs:disable PSR1.Files.SideEffects.FoundWithSymbols
// phpcs:disable PSR1.Classes.ClassDeclaration.MultipleClasses

/* Start of Site Kit modified code. */
namespace {
    if ( isset( $_GET['healthCheck'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
        echo 'ok';
        exit;
    }
    // Return early when including to use in external health check.
    // All classes will be defined but no further statements will be executed.
    if ( defined( 'GOOGLESITEKIT_GTG_ENDPOINT_HEALTH_CHECK' ) ) {
        return;
    }
}
/* End of Site Kit modified code. */

namespace Google\GoogleTagGatewayLibrary\Proxy {
use Google\GoogleTagGatewayLibrary\Http\RequestHelper;
use Google\GoogleTagGatewayLibrary\Http\ServerRequestContext;

/** Runner class to execute the proxy request. */
final class Runner
{
    /**
     * Request helper functions.
     *
     * @var RequestHelper
     */
    private RequestHelper $helper;
    /**
     * Measurement request helper.
     *
     * @var Measurement
     */
    private Measurement $measurement;
    /**
     * Constructor.
     *
     * @param RequestHelper $helper
     */
    public function __construct(RequestHelper $helper, Measurement $measurement)
    {
        $this->helper = $helper;
        $this->measurement = $measurement;
    }
    /** Run the core logic for forwarding traffic. */
    public function run(): void
    {
        $response = $this->measurement->run();
        $this->helper->setHeaders($response['headers']);
        http_response_code($response['statusCode']);
        echo $response['body'];
    }
    /** Create an instance of the runner with the system defaults. */
    public static function create()
    {
        $helper = new RequestHelper();
        $context = ServerRequestContext::create();
        $measurement = new Measurement($helper, $context);
        return new self($helper, $measurement);
    }
}
}

namespace Google\GoogleTagGatewayLibrary\Http {
/**
 * Isolates network requests and other methods like exit to inject into classes.
 */
class RequestHelper
{
    /**
     * Helper method to exit the script early and send back a status code.
     *
     * @param int $statusCode
     */
    public function invalidRequest(int $statusCode): void
    {
        http_response_code($statusCode);
        exit;
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
    public function sendRequest(string $method, string $url, array $headers = [], ?string $body = null): array
    {
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
    protected function sendCurlRequest(string $method, string $url, array $headers = [], ?string $body = null): array
    {
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
        return array('body' => $body, 'headers' => $headers, 'statusCode' => $statusCode);
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
    protected function sendFileGetContents(string $method, string $url, array $headers = [], ?string $body = null): array
    {
        $httpContext = ['method' => strtoupper($method), 'follow_location' => 0, 'max_redirects' => 0, 'ignore_errors' => true];
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
        return array('body' => $result, 'headers' => $headers, 'statusCode' => $statusCode);
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
    /**
     * Takes a single URL query parameter which has not been encoded and
     * ensures its key & value are encoded.
     *
     * @param string $parameter Query parameter to encode.
     * @return string The new query parameter encoded.
     */
    public static function encodeQueryParameter(string $parameter): string
    {
        list($key, $value) = explode('=', $parameter, 2) + ['', ''];
        // We just manually encode to avoid any nuances that may occur as a
        // result of `http_build_query`. One such nuance is that
        // `http_build_query` will add an index to query parameters that
        // are repeated through an array. We would only be able to store
        // repeated values as an array as associative arrays cannot have the
        // same key multiple times. This makes `http_build_query`
        // undesirable as we should pass parameters through as they come in
        // and not modify them or change the key.
        $key = rawurlencode($key);
        $value = rawurlencode($value);
        return "{$key}={$value}";
    }
}
}

namespace Google\GoogleTagGatewayLibrary\Http {
/** Request context populated with common server set values. */
final class ServerRequestContext
{
    /**
     * Server set associative array. Normally the same as $_SERVER.
     *
     * @var array
     */
    private $serverParams;
    /**
     * Associative array of query parameters. Normally the same as $_GET
     *
     * @var array
     */
    private $queryParams;
    /**
     * The current server request's body.
     *
     * @var string
     */
    private $requestBody;
    /**
     * Constructor
     *
     * @param array $serverParams
     * @param array $queryParams
     * @param string $requestBody
     */
    public function __construct(array $serverParams, array $queryParams, string $requestBody)
    {
        $this->serverParams = $serverParams;
        $this->queryParams = $queryParams;
        $this->requestBody = $requestBody;
    }
    /** Create an instance with the system defaults. */
    public static function create()
    {
        $body = file_get_contents("php://input") ?? '';
        return new self($_SERVER, $_GET, $body);
    }
    /**
     * Fetch the current request's request body.
     *
     * @return string The current request body.
     */
    public function getBody(): string
    {
        return $this->requestBody ?? '';
    }
    public function getRedirectorFile()
    {
        $redirectorFile = $this->serverParams['SCRIPT_NAME'] ?? '';
        if (empty($redirectorFile)) {
            return '';
        }
        return RequestHelper::sanitizePathForUrl($redirectorFile);
    }
    /**
     * Get headers from the current request as an array of strings.
     * Similar to how you set headers using the `headers` function.
     *
     * @param array $filterHeaders Filter out headers from the return value.
     */
    public function getHeaders(array $filterHeaders = []): array
    {
        $headers = [];
        // Extra headers not prefixed with `HTTP_`
        $extraHeaders = ["CONTENT_TYPE" => 'content-type', "CONTENT_LENGTH" => 'content-length', "CONTENT_MD5" => 'content-md5'];
        foreach ($this->serverParams as $key => $value) {
            # Skip reserved headers
            if (isset($filterHeaders[$key])) {
                continue;
            }
            # All PHP request headers are available under the $_SERVER variable
            # and have a key prefixed with `HTTP_` according to:
            # https://www.php.net/manual/en/reserved.variables.server.php#refsect1-reserved.variables.server-description
            $headerKey = '';
            if (substr($key, 0, 5) === 'HTTP_') {
                # PHP defaults to every header key being all capitalized.
                # Format header key as lowercase with `-` as word separator.
                # For example: cache-control
                $headerKey = strtolower(str_replace('_', '-', substr($key, 5)));
            } elseif (isset($extraHeaders[$key])) {
                $headerKey = $extraHeaders[$key];
            }
            if (empty($headerKey) || empty($value)) {
                continue;
            }
            $headers[] = "{$headerKey}: {$value}";
        }
        // Add extra x-forwarded-for if remote address is present.
        if (isset($this->serverParams['REMOTE_ADDR'])) {
            $headers[] = "x-forwarded-for: {$this->serverParams['REMOTE_ADDR']}";
        }
        // Add extra geo if present in the query parameters.
        $geo = $this->getGeoParam();
        if (!empty($geo)) {
            $headers[] = "x-forwarded-countryregion: {$geo}";
        }
        return $headers;
    }
    /**
     * Get the request method made for the current request.
     *
     * @return string
     */
    public function getMethod()
    {
        return @$this->serverParams['REQUEST_METHOD'] ?: 'GET';
    }
    /** Get and validate the geo parameter from the request. */
    public function getGeoParam()
    {
        $geo = $this->queryParams['geo'] ?? '';
        // Basic geo validation
        if (!preg_match('/^[A-Za-z0-9-]+$/', $geo)) {
            return '';
        }
        return $geo;
    }
    /** Get the tag id query parameter from the request.  */
    public function getTagId()
    {
        $tagId = $this->queryParams['id'] ?? '';
        // Validate tagId
        if (!preg_match('/^[A-Za-z0-9-]+$/', $tagId)) {
            return '';
        }
        return $tagId;
    }
    /** Get the destination query parameter from the request.  */
    public function getDestination()
    {
        $path = $this->queryParams['s'] ?? '';
        // When measurement path is present it might accidentally pass an empty
        // path character depending on how the url rules are processed so as a
        // safety when path is empty we should assume that it is a request to
        // the root.
        if (empty($path)) {
            $path = '/';
        }
        // Remove reserved query parameters from the query string
        $params = $this->queryParams;
        unset($params['id'], $params['s'], $params['geo'], $params['mpath']);
        $containsQueryParameters = strpos($path, '?') !== false;
        if ($containsQueryParameters) {
            list($path, $query) = explode('?', $path, 2);
            $path .= '?' . RequestHelper::encodeQueryParameter($query);
        }
        if (!empty($params)) {
            $paramSeparator = $containsQueryParameters ? '&' : '?';
            $path .= $paramSeparator . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        }
        return $path;
    }
    /**Get the measurement path query parameter from the request.  */
    public function getMeasurementPath()
    {
        return $this->queryParams['mpath'] ?? '';
    }
}
}

namespace Google\GoogleTagGatewayLibrary\Proxy {
use Google\GoogleTagGatewayLibrary\Http\RequestHelper;
use Google\GoogleTagGatewayLibrary\Http\ServerRequestContext;
/** Core measurement.php logic. */
final class Measurement
{
    private const TAG_ID_QUERY = '?id=';
    private const GEO_QUERY = '&geo=';
    private const PATH_QUERY = '&s=';
    private const FPS_PATH = 'PHP_GTG_REPLACE_PATH';
    /**
     * Reserved request headers that should not be sent as part of the
     * measurement request.
     *
     * @var array<string, bool>
     */
    private const RESERVED_HEADERS = [
        # PHP managed headers which will be auto populated by curl or file_get_contents.
        'HTTP_ACCEPT_ENCODING' => true,
        'HTTP_CONNECTION' => true,
        'HTTP_CONTENT_LENGTH' => true,
        'CONTENT_LENGTH' => true,
        'HTTP_EXPECT' => true,
        'HTTP_HOST' => true,
        'HTTP_TRANSFER_ENCODING' => true,
        # Sensitive headers to exclude from all requests.
        'HTTP_AUTHORIZATION' => true,
        'HTTP_PROXY_AUTHORIZATION' => true,
        'HTTP_X_API_KEY' => true,
    ];
    /**
     * Request helper.
     *
     * @var RequestHelper
     */
    private RequestHelper $helper;
    /**
     * Server request context.
     *
     * @var ServerRequestContext
     */
    private ServerRequestContext $serverRequest;
    /**
     * Create the measurement request handler.
     *
     * @param RequestHelper $helper
     * @param ServerRequestContext $serverReqeust
     */
    public function __construct(RequestHelper $helper, ServerRequestContext $serverRequest)
    {
        $this->helper = $helper;
        $this->serverRequest = $serverRequest;
    }
    /** Run the measurement logic. */
    public function run()
    {
        $redirectorFile = $this->serverRequest->getRedirectorFile();
        if (empty($redirectorFile)) {
            $this->helper->invalidRequest(500);
            return "";
        }
        $tagId = $this->serverRequest->getTagId();
        $path = $this->serverRequest->getDestination();
        $geo = $this->serverRequest->getGeoParam();
        $mpath = $this->serverRequest->getMeasurementPath();
        if (empty($tagId) || empty($path)) {
            $this->helper->invalidRequest(400);
            return "";
        }
        $useMpath = empty($mpath) ? self::FPS_PATH : $mpath;
        $fpsUrl = 'https://' . $tagId . '.fps.goog/' . $useMpath . $path;
        $requestHeaders = $this->serverRequest->getHeaders(self::RESERVED_HEADERS);
        $method = $this->serverRequest->getMethod();
        $body = $this->serverRequest->getBody();
        $response = $this->helper->sendRequest($method, $fpsUrl, $requestHeaders, $body);
        if ($useMpath === self::FPS_PATH) {
            $substitutionMpath = $redirectorFile . self::TAG_ID_QUERY . $tagId;
            if (!empty($geo)) {
                $substitutionMpath .= self::GEO_QUERY . $geo;
            }
            $substitutionMpath .= self::PATH_QUERY;
            if (self::isScriptResponse($response['headers'])) {
                $response['body'] = str_replace('/' . self::FPS_PATH . '/', $substitutionMpath, $response['body']);
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
                    $newValue = str_replace('/' . self::FPS_PATH, $substitutionMpath, $value);
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
}
}

namespace {
use Google\GoogleTagGatewayLibrary\Proxy\Runner;
Runner::create()->run();
}
