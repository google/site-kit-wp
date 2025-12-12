<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle\Resource;

use Google\Service\SubscribewithGoogle\ListOrdersResponse;
use Google\Service\SubscribewithGoogle\Order;
use Google\Service\SubscribewithGoogle\RefundOrderRequest;

/**
 * The "orders" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google\Service\SubscribewithGoogle(...);
 *   $orders = $subscribewithgoogleService->publications_readers_orders;
 *  </code>
 */
class PublicationsReadersOrders extends \Google\Service\Resource
{
  /**
   * Gets order's information. (orders.get)
   *
   * @param string $name Required. The resource name of the Order. Format:
   * publications/{publication}/readers/{reader}/orders/{order}
   * @param array $optParams Optional parameters.
   * @return Order
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], Order::class);
  }
  /**
   * List all orders based on the filter, only the orders from the requested
   * publication and reader will be returned. This API supports wildcard matching
   * for publication and reader. For example,
   * `publications/pub123/readers/-/orders` will return all orders for
   * publications pub123. (orders.listPublicationsReadersOrders)
   *
   * @param string $parent Required. The parent, which owns this collection of
   * Orders. Format: publications/{publication}/readers/{reader} reader can be a
   * wildcard "-". For example,`publications/pub123/readers/-/orders` will return
   * all orders for publications pub123.
   * @param array $optParams Optional parameters.
   *
   * @opt_param string filter Optional. Filter of the orders list. Grammar defined
   * as https://google.aip.dev/160. e.g.,
   * order.update_time>=2025-04-01T00:00:00-04:00
   * @opt_param int pageSize Optional. The maximum number of Orders to return. The
   * service may return fewer than this value. If unspecified, at most 100 Orders
   * will be returned. The maximum value is 1000; values above 1000 will be
   * coerced to 1000.
   * @opt_param string pageToken Optional. A token identifying a page of results
   * the server should return. Typically, this is the value of
   * ListOrdersResponse.next_page_token returned from the previous call to
   * `ListOrders` method.
   * @return ListOrdersResponse
   * @throws \Google\Service\Exception
   */
  public function listPublicationsReadersOrders($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListOrdersResponse::class);
  }
  /**
   * Refunds the order identified by order id for a given user under the given
   * publication. Returns the order, which will not have finished processing the
   * refund and will appear as not refunded. (orders.refund)
   *
   * @param string $name Required. The resource name of the Order. Format:
   * publications/{publication}/readers/{reader}/orders/{order}
   * @param RefundOrderRequest $postBody
   * @param array $optParams Optional parameters.
   * @return Order
   * @throws \Google\Service\Exception
   */
  public function refund($name, RefundOrderRequest $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('refund', [$params], Order::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PublicationsReadersOrders::class, 'Google_Service_SubscribewithGoogle_Resource_PublicationsReadersOrders');
