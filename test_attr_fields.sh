#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Testing allPaBtu..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 1) { nodes { name allPaBtu { nodes { slug } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"

echo "Testing paBtus..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 1) { nodes { name paBtus { nodes { slug } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"

echo "Testing paBtu (connection?)..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 1) { nodes { name paBtu { nodes { slug } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
