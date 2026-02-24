#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Testing GlobalProductAttribute..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 1) { nodes { ... on SimpleProduct { name attributes { nodes { name ... on GlobalProductAttribute { terms { nodes { slug } } } } } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
