#!/bin/bash
sed -i "s/define( 'DB_NAME', 'climaticpro_wp_new' );/define( 'DB_NAME', getenv_docker('WORDPRESS_DB_NAME', 'climaticpro_wp') );/" wordpress/wp-config.php
sed -i "s/define( 'DB_USER', 'climaticpro_wp' );/define( 'DB_USER', getenv_docker('WORDPRESS_DB_USER', 'climaticpro_wp') );/" wordpress/wp-config.php
sed -i "s/define( 'DB_PASSWORD', 'XWBTMMTF0KWTEp7wVzrY' );/define( 'DB_PASSWORD', getenv_docker('WORDPRESS_DB_PASSWORD', 'XWBTMMTF0KWTEp7wVzrY') );/" wordpress/wp-config.php
sed -i "s/define( 'DB_HOST', '172.18.0.1:3306' );/define( 'DB_HOST', getenv_docker('WORDPRESS_DB_HOST', 'mariadb') );/" wordpress/wp-config.php
sed -i "s|define( 'WP_HOME', 'https://cms.climaticpro.ro' );|define( 'WP_HOME', getenv_docker('WP_HOME', 'http://localhost:8083') );|" wordpress/wp-config.php
sed -i "s|define( 'WP_SITEURL', 'https://cms.climaticpro.ro' );|define( 'WP_SITEURL', getenv_docker('WP_SITEURL', 'http://localhost:8083') );|" wordpress/wp-config.php
