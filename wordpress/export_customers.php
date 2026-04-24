<?php
// Load WordPress Environment
require( dirname( __FILE__ ) . '/wp-load.php' );

// Get orders with status 'completed' or 'processing'
$args = array(
    'limit'  => -1,
    'status' => array('wc-completed', 'wc-processing'),
    'return' => 'ids',
);

$order_ids = wc_get_orders( $args );
$customers = array();

foreach ( $order_ids as $order_id ) {
    $order = wc_get_order( $order_id );
    if ( ! $order ) {
        continue;
    }

    $customer_data = array(
        'order_id'   => $order->get_id(),
        'date'       => $order->get_date_created() ? $order->get_date_created()->date( 'Y-m-d H:i:s' ) : '',
        'first_name' => $order->get_billing_first_name(),
        'last_name'  => $order->get_billing_last_name(),
        'phone'      => $order->get_billing_phone(),
        'email'      => $order->get_billing_email(),
        'total'      => $order->get_total(),
        'items'      => array()
    );
    
    // Attempt to get items to help with targeting/segmentation
    foreach ( $order->get_items() as $item_id => $item ) {
        $customer_data['items'][] = $item->get_name();
    }

    $customers[] = $customer_data;
}

// Output JSON
header('Content-Type: application/json');
echo json_encode($customers, JSON_PRETTY_PRINT);
